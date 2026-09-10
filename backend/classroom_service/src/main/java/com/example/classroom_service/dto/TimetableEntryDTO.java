package com.example.classroom_service.dto;

import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.model.TimetableEntry.SlotType;
import lombok.*;
import java.time.LocalTime;
import java.util.List;

public class TimetableEntryDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Long classroomId;
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private String subjectCode;
        private SlotType type;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private String subjectCode;
        private SlotType type;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private Long classroomId;
        private DayOfWeek day;
        private LocalTime startTime;
        private LocalTime endTime;
        private String subject;
        private String subjectCode;
        private SlotType type;
        private Long facultyId;
        private String facultyName;
        private String roomNumber;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class WeeklyResponse {
        private DayOfWeek day;
        private List<Response> slots;
    }
}