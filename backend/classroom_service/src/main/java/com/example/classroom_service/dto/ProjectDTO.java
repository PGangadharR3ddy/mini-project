package com.example.classroom_service.dto;

import com.example.classroom_service.model.Project.PostedByRole;
import com.example.classroom_service.model.Project.ProjectStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectDTO {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private String title;
        private String description;
        private String techStack;
        private String repoUrl;
        private String liveUrl;
        private Integer teamSize;
        private String tags;
        private Long classroomId;       // null = open to all
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private String title;
        private String description;
        private String techStack;
        private String repoUrl;
        private String liveUrl;
        private Integer teamSize;
        private String tags;
        private ProjectStatus status;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String techStack;
        private String repoUrl;
        private String liveUrl;
        private Integer teamSize;
        private String tags;
        private ProjectStatus status;
        private Long classroomId;
        private String classroomName;
        private String department;
        private Long postedBy;
        private String postedByName;
        private PostedByRole postedByRole;
        private Integer memberCount;
        private Boolean isMember;        // is the requesting user already a member?
        private Boolean hasRequested;    // has the requesting user already sent a request?
        private List<MemberResponse> members;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MemberResponse {
        private Long studentId;
        private String studentName;
        private String studentDepartment;
        private LocalDateTime joinedAt;
    }
}