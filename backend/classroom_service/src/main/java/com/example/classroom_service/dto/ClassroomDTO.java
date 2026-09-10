package com.example.classroom_service.dto;

import lombok.*;
import java.util.List;

public class ClassroomDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
        private Integer capacity;
        private Integer studentCount;
        private String academicYear;
        private String advisorName;
        private String advisorEmail;
        private String classroomNumber;
        private Integer syllabusProgress;
        private Integer totalLecturesToday;
        private Integer pendingGrading;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
        private Integer capacity;
        private Integer studentCount;
        private String academicYear;
        private String advisorName;
        private String advisorEmail;
        private String classroomNumber;
        private Integer syllabusProgress;
        private Integer totalLecturesToday;
        private Integer pendingGrading;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
        private Integer capacity;
        private Integer studentCount;
        private String academicYear;
        private String advisorName;
        private String advisorEmail;
        private String classroomNumber;
        private Integer syllabusProgress;
        private Integer totalLecturesToday;
        private Integer pendingGrading;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DetailResponse {
        private Long id;
        private String name;
        private String section;
        private String department;
        private Integer year;
        private Integer semester;
        private Integer capacity;
        private Integer studentCount;
        private String academicYear;
        private String advisorName;
        private String advisorEmail;
        private String classroomNumber;
        private Integer syllabusProgress;
        private Integer totalLecturesToday;
        private Integer pendingGrading;
        private List<TimetableEntryDTO.Response> timetable;
        private List<AnnouncementDTO.Response> announcements;
        private List<AcademicEventDTO.Response> upcomingEvents;
    }
}