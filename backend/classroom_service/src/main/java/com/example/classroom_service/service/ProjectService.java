package com.example.classroom_service.service;

import com.example.classroom_service.dto.JoinRequestDTO;
import com.example.classroom_service.dto.ProjectDTO;
import com.example.classroom_service.exception.AccessDeniedException;
import com.example.classroom_service.exception.ConflictException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.ProjectMapper;
import com.example.classroom_service.model.*;
import com.example.classroom_service.model.JoinRequest.RequestStatus;
import com.example.classroom_service.model.Project.PostedByRole;
import com.example.classroom_service.model.Project.ProjectStatus;
import com.example.classroom_service.repository.JoinRequestRepository;
import com.example.classroom_service.repository.ProjectMemberRepository;
import com.example.classroom_service.repository.ProjectRepository;
import com.example.classroom_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final JoinRequestRepository joinRequestRepo;
    private final ProjectMemberRepository memberRepo;
    private final ProjectMapper mapper;
    private final ClassroomService classroomService;

    // ─── Create Project ───────────────────────────────────────────────────────

    @Transactional
    public ProjectDTO.Response create(ProjectDTO.CreateRequest req, UserPrincipal actor) {
        Classroom classroom = req.getClassroomId() != null
                ? classroomService.getOrThrow(req.getClassroomId())
                : null;

        String department = classroom != null
                ? classroom.getDepartment()
                : actor.getDepartment();

        PostedByRole role = PostedByRole.valueOf(actor.getRole());

        Project saved = projectRepo.save(
                mapper.toEntity(req, classroom, actor.getUserId(),
                        actor.getName(), role, department));

        // Auto-add poster as first member if student
        if ("STUDENT".equals(actor.getRole())) {
            ProjectMember self = ProjectMember.builder()
                    .project(saved)
                    .studentId(actor.getUserId())
                    .studentName(actor.getName())
                    .studentDepartment(actor.getDepartment())
                    .build();
            memberRepo.save(self);
        }

        return toResponseForUser(saved, actor.getUserId());
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public Page<ProjectDTO.Response> getAll(Pageable pageable, UserPrincipal actor) {
        return projectRepo.findAllByOrderByCreatedAtDesc(pageable)
                .map(p -> toResponseForUser(p, actor.getUserId()));
    }

    public Page<ProjectDTO.Response> getByClassroom(Long classroomId,
                                                     ProjectStatus status,
                                                     Pageable pageable,
                                                     UserPrincipal actor) {
        Page<Project> page = status != null
                ? projectRepo.findByClassroomIdAndStatusOrderByCreatedAtDesc(classroomId, status, pageable)
                : projectRepo.findByClassroomIdOrderByCreatedAtDesc(classroomId, pageable);
        return page.map(p -> toResponseForUser(p, actor.getUserId()));
    }

    public Page<ProjectDTO.Response> getByDepartment(String department,
                                                      ProjectStatus status,
                                                      Pageable pageable,
                                                      UserPrincipal actor) {
        Page<Project> page = status != null
                ? projectRepo.findByDepartmentAndStatusOrderByCreatedAtDesc(department, status, pageable)
                : projectRepo.findByDepartmentOrderByCreatedAtDesc(department, pageable);
        return page.map(p -> toResponseForUser(p, actor.getUserId()));
    }

    public Page<ProjectDTO.Response> search(String keyword,
                                             Pageable pageable,
                                             UserPrincipal actor) {
        return projectRepo.searchByKeyword(keyword, pageable)
                .map(p -> toResponseForUser(p, actor.getUserId()));
    }

    public ProjectDTO.Response getById(Long id, UserPrincipal actor) {
        return toResponseForUser(getOrThrow(id), actor.getUserId());
    }

    public List<ProjectDTO.Response> getMyProjects(UserPrincipal actor) {
        return projectRepo.findByPostedByOrderByCreatedAtDesc(actor.getUserId())
                .stream()
                .map(p -> toResponseForUser(p, actor.getUserId()))
                .collect(Collectors.toList());
    }

    public List<ProjectDTO.Response> getProjectsImMemberOf(UserPrincipal actor) {
        return projectRepo.findProjectsByMember(actor.getUserId())
                .stream()
                .map(p -> toResponseForUser(p, actor.getUserId()))
                .collect(Collectors.toList());
    }

    // ─── Update / Delete ──────────────────────────────────────────────────────

    @Transactional
    public ProjectDTO.Response update(Long id, ProjectDTO.UpdateRequest req, UserPrincipal actor) {
        Project project = getOrThrow(id);
        ensureOwner(project, actor);
        mapper.updateEntity(project, req);
        return toResponseForUser(projectRepo.save(project), actor.getUserId());
    }

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        Project project = getOrThrow(id);
        ensureOwnerOrAdmin(project, actor);
        projectRepo.delete(project);
    }

    // ─── Join Requests ────────────────────────────────────────────────────────

    @Transactional
    public JoinRequestDTO.Response sendJoinRequest(JoinRequestDTO.CreateRequest req,
                                                    UserPrincipal actor) {
        Project project = getOrThrow(req.getProjectId());

        // Can't request to join your own project
        if (project.getPostedBy().equals(actor.getUserId())) {
            throw new ConflictException("You cannot request to join your own project.");
        }

        // Already a member
        if (memberRepo.existsByProjectIdAndStudentId(req.getProjectId(), actor.getUserId())) {
            throw new ConflictException("You are already a member of this project.");
        }

        // Already requested
        joinRequestRepo.findByProjectIdAndRequestedBy(req.getProjectId(), actor.getUserId())
                .ifPresent(r -> { throw new ConflictException("You have already sent a join request."); });

        // Project must be open
        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new ConflictException("This project is not accepting new members.");
        }

        JoinRequest saved = joinRequestRepo.save(JoinRequest.builder()
                .project(project)
                .requestedBy(actor.getUserId())
                .requestedByName(actor.getName())
                .requestedByDepartment(actor.getDepartment())
                .message(req.getMessage())
                .status(RequestStatus.PENDING)
                .build());

        return mapper.toJoinRequestResponse(saved);
    }

    public List<JoinRequestDTO.Response> getRequestsForProject(Long projectId,
                                                                UserPrincipal actor) {
        Project project = getOrThrow(projectId);
        ensureOwner(project, actor);
        return joinRequestRepo.findByProjectIdOrderByRequestedAtDesc(projectId)
                .stream()
                .map(mapper::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    public List<JoinRequestDTO.Response> getMyRequests(UserPrincipal actor) {
        return joinRequestRepo.findByRequestedByOrderByRequestedAtDesc(actor.getUserId())
                .stream()
                .map(mapper::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public JoinRequestDTO.Response respondToRequest(Long requestId,
                                                     boolean accept,
                                                     UserPrincipal actor) {
        JoinRequest request = joinRequestRepo.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Join request not found: " + requestId));

        Project project = request.getProject();
        ensureOwner(project, actor);

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new ConflictException("This request has already been responded to.");
        }

        if (accept) {
            // Check team size limit
            int currentMembers = memberRepo.countByProjectId(project.getId());
            if (project.getTeamSize() != null && currentMembers >= project.getTeamSize()) {
                throw new ConflictException("Team is already full.");
            }

            // Add as member
            memberRepo.save(ProjectMember.builder()
                    .project(project)
                    .studentId(request.getRequestedBy())
                    .studentName(request.getRequestedByName())
                    .studentDepartment(request.getRequestedByDepartment())
                    .build());

            request.setStatus(RequestStatus.ACCEPTED);

            // Auto-close if team is now full
            int newCount = memberRepo.countByProjectId(project.getId());
            if (project.getTeamSize() != null && newCount >= project.getTeamSize()) {
                project.setStatus(ProjectStatus.IN_PROGRESS);
                projectRepo.save(project);
            }
        } else {
            request.setStatus(RequestStatus.REJECTED);
        }

        return mapper.toJoinRequestResponse(joinRequestRepo.save(request));
    }

    @Transactional
    public void removeMember(Long projectId, Long studentId, UserPrincipal actor) {
        Project project = getOrThrow(projectId);
        ensureOwnerOrAdmin(project, actor);

        ProjectMember member = memberRepo.findByProjectIdAndStudentId(projectId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this project."));

        memberRepo.delete(member);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ProjectDTO.Response toResponseForUser(Project p, Long userId) {
        boolean isMember = memberRepo.existsByProjectIdAndStudentId(p.getId(), userId);
        boolean hasRequested = joinRequestRepo
                .findByProjectIdAndRequestedBy(p.getId(), userId).isPresent();
        return mapper.toResponse(p, userId, isMember, hasRequested);
    }

    private Project getOrThrow(Long id) {
        return projectRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
    }

    private void ensureOwner(Project p, UserPrincipal actor) {
        if (!p.getPostedBy().equals(actor.getUserId())) {
            throw new AccessDeniedException("Only the project owner can perform this action.");
        }
    }

    private void ensureOwnerOrAdmin(Project p, UserPrincipal actor) {
        boolean isOwner = p.getPostedBy().equals(actor.getUserId());
        boolean isAdmin = "ADMIN".equals(actor.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the project owner or admin can perform this action.");
        }
    }
}