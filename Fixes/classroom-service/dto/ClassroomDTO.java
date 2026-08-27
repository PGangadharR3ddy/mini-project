package com.example.classroom_service.dto;

import lombok.*;

import java.util.List;

public class ClassroomDTO {

    // ─── Request ───────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
    }

    // ─── Response ──────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetailResponse {
        private Long id;
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
        private List<TimetableEntryDTO.Response> timetable;
        private List<AnnouncementDTO.Response> announcements;
        private List<AcademicEventDTO.Response> upcomingEvents;
    }
}
