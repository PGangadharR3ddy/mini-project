package com.example.classroom_service.controller;

import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.dto.StudyAssistantDTO;
import com.example.classroom_service.security.UserPrincipal;
import com.example.classroom_service.service.StudyAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyAssistantController {

    private final StudyAssistantService studyService;

    // ─── Upload PDF for Q&A ───────────────────────────────────────────────────

    @PostMapping(value = "/documents", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<StudyAssistantDTO.UploadResponse>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) Long classroomId,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("PDF uploaded and indexed",
                        studyService.uploadDocument(file, classroomId, actor)));
    }

    // ─── Ask a question ───────────────────────────────────────────────────────

    @PostMapping("/documents/{documentId}/ask")
    public ResponseEntity<ApiResponse<StudyAssistantDTO.AskResponse>> ask(
            @PathVariable String documentId,
            @RequestBody StudyAssistantDTO.AskRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                studyService.ask(documentId, req.getQuestion(), actor)));
    }

    // ─── Study mode (summary + quiz) ─────────────────────────────────────────

    @PostMapping(value = "/study-mode", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<StudyAssistantDTO.StudyResponse>> studyMode(
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(studyService.study(file)));
    }

    // ─── My uploaded documents ────────────────────────────────────────────────

    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<StudyAssistantDTO.DocumentResponse>>> getMyDocuments(
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(studyService.getMyDocuments(actor)));
    }

    // ─── Documents for a classroom ────────────────────────────────────────────

    @GetMapping("/documents/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<List<StudyAssistantDTO.DocumentResponse>>> getByClassroom(
            @PathVariable Long classroomId,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                studyService.getByClassroom(classroomId, actor)));
    }

    // ─── Delete a document ────────────────────────────────────────────────────

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable String documentId,
            @AuthenticationPrincipal UserPrincipal actor) {
        studyService.deleteDocument(documentId, actor);
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }

    // ─── Health check ─────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        return ResponseEntity.ok(ApiResponse.success(studyService.health()));
    }
}