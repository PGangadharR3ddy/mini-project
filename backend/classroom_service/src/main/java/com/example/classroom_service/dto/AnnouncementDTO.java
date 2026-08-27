package com.example.classroom_service.dto;

import com.example.classroom_service.model.Announcement.AnnouncementType;
import lombok.*;

import java.time.LocalDateTime;

public class AnnouncementDTO {

    // ─── Request ───────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long classroomId;           // null for dept-level
        private String department;          // null for section-level
        private String title;
        private String body;
        private AnnouncementType type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String body;
    }

    // ─── Response ──────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private String department;
        private String title;
        private String body;
        private AnnouncementType type;
        private Long createdBy;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}