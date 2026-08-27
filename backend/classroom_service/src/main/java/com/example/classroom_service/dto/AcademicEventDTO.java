package com.example.classroom_service.dto;

import com.example.classroom_service.model.AcademicEvent.EventType;
import lombok.*;

import java.time.LocalDateTime;

public class AcademicEventDTO {

    // ─── Request ───────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long classroomId;
        private String title;
        private String description;
        private EventType type;
        private String subject;
        private LocalDateTime eventDateTime;
        private Integer durationMinutes;
        private String venue;
        private Boolean syncToCalendar;     // trigger Google Calendar sync?
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String description;
        private EventType type;
        private String subject;
        private LocalDateTime eventDateTime;
        private Integer durationMinutes;
        private String venue;
    }

    // ─── Response ──────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private String classroomName;
        private String title;
        private String description;
        private EventType type;
        private String subject;
        private LocalDateTime eventDateTime;
        private Integer durationMinutes;
        private String venue;
        private String googleCalendarEventId;
        private Boolean syncedToCalendar;
        private Long createdBy;
        private String createdByName;
        private LocalDateTime createdAt;
    }
}