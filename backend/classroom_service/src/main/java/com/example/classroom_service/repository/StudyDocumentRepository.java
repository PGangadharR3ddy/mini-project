package com.example.classroom_service.repository;

import com.example.classroom_service.model.StudyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyDocumentRepository extends JpaRepository<StudyDocument, Long> {

    // All documents uploaded by a user
    List<StudyDocument> findByUploadedByOrderByUploadedAtDesc(Long uploadedBy);

    // Find by FastAPI document_id
    Optional<StudyDocument> findByDocumentId(String documentId);

    // All documents for a classroom
    List<StudyDocument> findByClassroomIdOrderByUploadedAtDesc(Long classroomId);
}