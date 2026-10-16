package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.JoinRequestDTO;
import com.example.classroom_service.dto.ProjectDTO;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.JoinRequest;
import com.example.classroom_service.model.Project;
import com.example.classroom_service.model.ProjectMember;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProjectMapper {

    public Project toEntity(ProjectDTO.CreateRequest req,
                            Classroom classroom,
                            Long postedBy,
                            String postedByName,
                            Project.PostedByRole postedByRole,
                            String department) {
        return Project.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .techStack(req.getTechStack())
                .repoUrl(req.getRepoUrl())
                .liveUrl(req.getLiveUrl())
                .teamSize(req.getTeamSize())
                .tags(req.getTags())
                .classroom(classroom)
                .department(department)
                .postedBy(postedBy)
                .postedByName(postedByName)
                .postedByRole(postedByRole)
                .status(Project.ProjectStatus.OPEN)
                .build();
    }

    public ProjectDTO.Response toResponse(Project p,
                                          Long requestingUserId,
                                          boolean isMember,
                                          boolean hasRequested) {
        List<ProjectDTO.MemberResponse> members = p.getMembers() == null ? List.of() :
                p.getMembers().stream()
                        .map(m -> ProjectDTO.MemberResponse.builder()
                                .studentId(m.getStudentId())
                                .studentName(m.getStudentName())
                                .studentDepartment(m.getStudentDepartment())
                                .joinedAt(m.getJoinedAt())
                                .build())
                        .collect(Collectors.toList());

        return ProjectDTO.Response.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .techStack(p.getTechStack())
                .repoUrl(p.getRepoUrl())
                .liveUrl(p.getLiveUrl())
                .teamSize(p.getTeamSize())
                .tags(p.getTags())
                .status(p.getStatus())
                .classroomId(p.getClassroom() != null ? p.getClassroom().getId() : null)
                .classroomName(p.getClassroom() != null ? p.getClassroom().getName() : null)
                .department(p.getDepartment())
                .postedBy(p.getPostedBy())
                .postedByName(p.getPostedByName())
                .postedByRole(p.getPostedByRole())
                .memberCount(members.size())
                .isMember(isMember)
                .hasRequested(hasRequested)
                .members(members)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    public void updateEntity(Project p, ProjectDTO.UpdateRequest req) {
        if (req.getTitle() != null)       p.setTitle(req.getTitle());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getTechStack() != null)   p.setTechStack(req.getTechStack());
        if (req.getRepoUrl() != null)     p.setRepoUrl(req.getRepoUrl());
        if (req.getLiveUrl() != null)     p.setLiveUrl(req.getLiveUrl());
        if (req.getTeamSize() != null)    p.setTeamSize(req.getTeamSize());
        if (req.getTags() != null)        p.setTags(req.getTags());
        if (req.getStatus() != null)      p.setStatus(req.getStatus());
    }

    public JoinRequestDTO.Response toJoinRequestResponse(JoinRequest jr) {
        return JoinRequestDTO.Response.builder()
                .id(jr.getId())
                .projectId(jr.getProject().getId())
                .projectTitle(jr.getProject().getTitle())
                .requestedBy(jr.getRequestedBy())
                .requestedByName(jr.getRequestedByName())
                .requestedByDepartment(jr.getRequestedByDepartment())
                .message(jr.getMessage())
                .status(jr.getStatus())
                .requestedAt(jr.getRequestedAt())
                .build();
    }
}