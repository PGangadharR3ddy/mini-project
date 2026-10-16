package com.example.classroom_service.service;

import com.example.classroom_service.client.StudyAssistantClient;
import com.example.classroom_service.dto.StudyAssistantDTO;
import com.example.classroom_service.exception.AccessDeniedException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.StudyDocument;
import com.example.classroom_service.repository.StudyDocumentRepository;
import com.example.classroom_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudyAssistantService {

    private final StudyAssistantClient client;
    private final StudyDocumentRepository documentRepo;
    private final ClassroomService classroomService;

    // ─── Upload PDF ───────────────────────────────────────────────────────────

    @Transactional
    public StudyAssistantDTO.UploadResponse uploadDocument(MultipartFile file,
                                                            Long classroomId,
                                                            UserPrincipal actor) {
        // Validate file type
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are supported.");
        }

        // Send to FastAPI
        Map<String, Object> fastApiResponse = client.uploadDocument(file);

        String documentId   = (String) fastApiResponse.get("document_id");
        Integer pages       = (Integer) fastApiResponse.get("pages_processed");
        Integer chunks      = (Integer) fastApiResponse.get("chunks_indexed");

        // Resolve classroom if provided
        Classroom classroom = classroomId != null
                ? classroomService.getOrThrow(classroomId)
                : null;

        // Persist metadata in PostgreSQL
        StudyDocument saved = documentRepo.save(StudyDocument.builder()
                .documentId(documentId)
                .filename(filename)
                .uploadedBy(actor.getUserId())
                .uploadedByName(actor.getName())
                .pagesProcessed(pages)
                .chunksIndexed(chunks)
                .classroom(classroom)
                .build());

        return toUploadResponse(saved);
    }

    // ─── Ask a question ───────────────────────────────────────────────────────

    public StudyAssistantDTO.AskResponse ask(String documentId,
                                              String question,
                                              UserPrincipal actor) {
        StudyDocument doc = getDocumentOrThrow(documentId);
        ensureOwner(doc, actor);

        Map<String, Object> result = client.askQuestion(documentId, question);

        return StudyAssistantDTO.AskResponse.builder()
                .documentId(documentId)
                .filename(doc.getFilename())
                .question(question)
                .answer(result.get("answer"))
                .sourcePages(castToIntList(result.get("source_pages")))
                .build();
    }

    // ─── Study mode ───────────────────────────────────────────────────────────

    public StudyAssistantDTO.StudyResponse study(MultipartFile file) {
        Map<String, Object> result = client.studyPdf(file);

        return StudyAssistantDTO.StudyResponse.builder()
                .filename((String) result.get("filename"))
                .pagesProcessed((Integer) result.get("pages_processed"))
                .sectionsProcessed((Integer) result.get("sections_processed"))
                .summary((String) result.get("summary"))
                .sectionSummaries(castToMapList(result.get("section_summaries")))
                .quiz(castToMapList(result.get("quiz")))
                .notice((String) result.get("notice"))
                .build();
    }

    // ─── My documents ─────────────────────────────────────────────────────────

    public List<StudyAssistantDTO.DocumentResponse> getMyDocuments(UserPrincipal actor) {
        return documentRepo.findByUploadedByOrderByUploadedAtDesc(actor.getUserId())
                .stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());
    }

    public List<StudyAssistantDTO.DocumentResponse> getByClassroom(Long classroomId,
                                                                     UserPrincipal actor) {
        return documentRepo.findByClassroomIdOrderByUploadedAtDesc(classroomId)
                .stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());
    }

    // ─── Delete document ──────────────────────────────────────────────────────

    @Transactional
    public void deleteDocument(String documentId, UserPrincipal actor) {
        StudyDocument doc = getDocumentOrThrow(documentId);
        ensureOwnerOrAdmin(doc, actor);
        documentRepo.delete(doc);
        // Note: FastAPI in-memory index will clear on restart anyway
        // If FastAPI later supports DELETE /documents/{id}, call it here
    }

    // ─── Health ───────────────────────────────────────────────────────────────

    public Map<String, Object> health() {
        return client.health();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private StudyDocument getDocumentOrThrow(String documentId) {
        return documentRepo.findByDocumentId(documentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Document not found: " + documentId));
    }

    private void ensureOwner(StudyDocument doc, UserPrincipal actor) {
        if (!doc.getUploadedBy().equals(actor.getUserId())) {
            throw new AccessDeniedException(
                    "You can only access your own documents.");
        }
    }

    private void ensureOwnerOrAdmin(StudyDocument doc, UserPrincipal actor) {
        boolean isOwner = doc.getUploadedBy().equals(actor.getUserId());
        boolean isAdmin = "ADMIN".equals(actor.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException(
                    "Only the document owner or admin can delete this.");
        }
    }

    private StudyAssistantDTO.UploadResponse toUploadResponse(StudyDocument d) {
        return StudyAssistantDTO.UploadResponse.builder()
                .id(d.getId())
                .documentId(d.getDocumentId())
                .filename(d.getFilename())
                .pagesProcessed(d.getPagesProcessed())
                .chunksIndexed(d.getChunksIndexed())
                .uploadedBy(d.getUploadedBy())
                .uploadedByName(d.getUploadedByName())
                .classroomId(d.getClassroom() != null ? d.getClassroom().getId() : null)
                .uploadedAt(d.getUploadedAt())
                .build();
    }

    private StudyAssistantDTO.DocumentResponse toDocumentResponse(StudyDocument d) {
        return StudyAssistantDTO.DocumentResponse.builder()
                .id(d.getId())
                .documentId(d.getDocumentId())
                .filename(d.getFilename())
                .pagesProcessed(d.getPagesProcessed())
                .chunksIndexed(d.getChunksIndexed())
                .uploadedBy(d.getUploadedBy())
                .uploadedByName(d.getUploadedByName())
                .classroomId(d.getClassroom() != null ? d.getClassroom().getId() : null)
                .uploadedAt(d.getUploadedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<Integer> castToIntList(Object obj) {
        if (obj instanceof List) return (List<Integer>) obj;
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castToMapList(Object obj) {
        if (obj instanceof List) return (List<Map<String, Object>>) obj;
        return List.of();
    }
}