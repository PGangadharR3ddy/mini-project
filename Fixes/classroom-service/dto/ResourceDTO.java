package com.example.classroom_service.dto;

import com.example.classroom_service.model.Resource.ResourceType;
import lombok.*;

import java.time.LocalDateTime;

public class ResourceDTO {

    // ─── Request ───────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long classroomId;
        private String title;
        private String description;
        private String subject;
        private ResourceType type;
        // fileUrl is set by the service after saving the uploaded file
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String description;
        private ResourceType type;
    }

    // ─── Response ──────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private String title;
        private String description;
        private String subject;
        private ResourceType type;
        private String fileUrl;
        private String fileName;
        private Long fileSizeBytes;
        private Long uploadedBy;
        private String uploadedByName;
        private LocalDateTime uploadedAt;
    }
}
