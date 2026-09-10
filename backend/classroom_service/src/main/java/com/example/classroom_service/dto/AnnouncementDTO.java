package com.example.classroom_service.dto;

import com.example.classroom_service.model.Announcement.AnnouncementType;
import lombok.*;
import java.time.LocalDateTime;

public class AnnouncementDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Long classroomId;
        private String department;
        private String title;
        private String body;
        private AnnouncementType type;
        private String authorRole;
        private String authorAvatar;
        private Boolean urgent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String title;
        private String body;
        private Boolean urgent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private String department;
        private String title;
        private String body;
        private AnnouncementType type;
        private Long createdBy;
        private String createdByName;
        private String authorRole;
        private String authorAvatar;
        private Boolean urgent;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}