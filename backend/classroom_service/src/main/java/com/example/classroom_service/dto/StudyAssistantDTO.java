package com.example.classroom_service.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class StudyAssistantDTO {

    // ─── Upload ───────────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UploadResponse {
        private Long id;                // Spring DB id
        private String documentId;      // FastAPI UUID
        private String filename;
        private Integer pagesProcessed;
        private Integer chunksIndexed;
        private Long uploadedBy;
        private String uploadedByName;
        private Long classroomId;
        private LocalDateTime uploadedAt;
    }

    // ─── Ask ──────────────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AskRequest {
        private String question;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AskResponse {
        private String documentId;
        private String filename;
        private String question;
        private Object answer;          // string or fallback object from FastAPI
        private List<Integer> sourcePages;
    }

    // ─── Study (summary + quiz) ───────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StudyResponse {
        private String filename;
        private Integer pagesProcessed;
        private Integer sectionsProcessed;
        private String summary;
        private List<Map<String, Object>> sectionSummaries;
        private List<Map<String, Object>> quiz;
        private String notice;
    }

    // ─── Document list ────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DocumentResponse {
        private Long id;
        private String documentId;
        private String filename;
        private Integer pagesProcessed;
        private Integer chunksIndexed;
        private Long uploadedBy;
        private String uploadedByName;
        private Long classroomId;
        private LocalDateTime uploadedAt;
    }

    // ─── Health ───────────────────────────────────────────────────────────────

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class HealthResponse {
        private Boolean ollamaConnected;
        private String model;
        private Boolean modelInstalled;
        private List<String> availableModels;
    }
}