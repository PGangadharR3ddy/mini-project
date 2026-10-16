package com.example.classroom_service.dto;

import com.example.classroom_service.model.AcademicEvent.EventType;
import lombok.*;
import java.time.LocalDateTime;

public class AcademicEventDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Long classroomId;
        private String title;
        private String description;
        private EventType type;
        private String subject;
        private LocalDateTime eventDateTime;
        private Integer durationMinutes;
        private String venue;
        private Boolean syncToCalendar;
        private Boolean isUrgent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String title;
        private String description;
        private EventType type;
        private String subject;
        private LocalDateTime eventDateTime;
        private Integer durationMinutes;
        private String venue;
        private Boolean isUrgent;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
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
        private Boolean isUrgent;
        private Long createdBy;
        private String createdByName;
        private LocalDateTime createdAt;
    }
}