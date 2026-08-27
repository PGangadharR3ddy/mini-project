package com.example.classroom_service.dto;

import com.example.classroom_service.model.DayOfWeek;
import lombok.*;

import java.time.LocalTime;
import java.util.List;

public class TimetableEntryDTO {

    // ─── Request ───────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long classroomId;
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    // ─── Response ──────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    // Grouped by day for weekly view
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklyResponse {
        private DayOfWeek day;
        private List<Response> slots;
    }
}
