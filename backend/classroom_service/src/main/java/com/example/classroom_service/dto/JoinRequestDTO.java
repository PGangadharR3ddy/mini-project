package com.example.classroom_service.dto;

import com.example.classroom_service.model.JoinRequest.RequestStatus;
import lombok.*;

import java.time.LocalDateTime;

public class JoinRequestDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Long projectId;
        private String message;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private Long requestedBy;
        private String requestedByName;
        private String requestedByDepartment;
        private String message;
        private RequestStatus status;
        private LocalDateTime requestedAt;
    }
}