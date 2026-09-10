package com.example.classroom_service.controller;

import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.dto.JoinRequestDTO;
import com.example.classroom_service.dto.ProjectDTO;
import com.example.classroom_service.model.Project.ProjectStatus;
import com.example.classroom_service.security.UserPrincipal;
import com.example.classroom_service.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ─── Project CRUD ─────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectDTO.Response>> create(
            @RequestBody ProjectDTO.CreateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", projectService.create(req, actor)));
    }

    // All projects — cross department discovery
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectDTO.Response>>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAll(pageable, actor)));
    }

    // Filter by classroom
    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<Page<ProjectDTO.Response>>> getByClassroom(
            @PathVariable Long classroomId,
            @RequestParam(required = false) ProjectStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getByClassroom(classroomId, status, pageable, actor)));
    }

    // Filter by department
    @GetMapping("/department/{department}")
    public ResponseEntity<ApiResponse<Page<ProjectDTO.Response>>> getByDepartment(
            @PathVariable String department,
            @RequestParam(required = false) ProjectStatus status,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getByDepartment(department, status, pageable, actor)));
    }

    // Search by keyword (title, tags, techStack)
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProjectDTO.Response>>> search(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.search(keyword, pageable, actor)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO.Response>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getById(id, actor)));
    }

    // My posted projects
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ProjectDTO.Response>>> getMyProjects(
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMyProjects(actor)));
    }

    // Projects I'm a member of
    @GetMapping("/joined")
    public ResponseEntity<ApiResponse<List<ProjectDTO.Response>>> getJoined(
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectsImMemberOf(actor)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody ProjectDTO.UpdateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Updated",
                projectService.update(id, req, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor) {
        projectService.delete(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Project deleted", null));
    }

    // ─── Join Requests ────────────────────────────────────────────────────────

    @PostMapping("/join-request")
    public ResponseEntity<ApiResponse<JoinRequestDTO.Response>> sendRequest(
            @RequestBody JoinRequestDTO.CreateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Request sent",
                        projectService.sendJoinRequest(req, actor)));
    }

    // Project owner views all requests for their project
    @GetMapping("/{projectId}/requests")
    public ResponseEntity<ApiResponse<List<JoinRequestDTO.Response>>> getRequests(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getRequestsForProject(projectId, actor)));
    }

    // My outgoing requests
    @GetMapping("/my-requests")
    public ResponseEntity<ApiResponse<List<JoinRequestDTO.Response>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMyRequests(actor)));
    }

    // Accept or reject a request
    @PutMapping("/requests/{requestId}/accept")
    public ResponseEntity<ApiResponse<JoinRequestDTO.Response>> accept(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Request accepted",
                projectService.respondToRequest(requestId, true, actor)));
    }

    @PutMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<JoinRequestDTO.Response>> reject(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Request rejected",
                projectService.respondToRequest(requestId, false, actor)));
    }

    // Remove a member from a project
    @DeleteMapping("/{projectId}/members/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserPrincipal actor) {
        projectService.removeMember(projectId, studentId, actor);
        return ResponseEntity.ok(ApiResponse.success("Member removed", null));
    }
}