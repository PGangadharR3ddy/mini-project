package com.example.classroom_service.controller;

import com.example.classroom_service.dto.AnnouncementDTO;
import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.security.UserPrincipal;
import com.example.classroom_service.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<ApiResponse<AnnouncementDTO.Response>> create(
            @RequestBody AnnouncementDTO.CreateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement posted",
                        announcementService.create(req, actor)));
    }

    // Student feed: section + dept + general announcements
    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<Page<AnnouncementDTO.Response>>> feed(
            @RequestParam Long classroomId,
            @RequestParam String department,
            @AuthenticationPrincipal UserPrincipal actor,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                announcementService.getAllVisibleToStudent(classroomId, department, pageable)));
    }

    // Section-specific announcements
    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<Page<AnnouncementDTO.Response>>> getByClassroom(
            @PathVariable Long classroomId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                announcementService.getByClassroom(classroomId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementDTO.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(announcementService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody AnnouncementDTO.UpdateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Updated",
                announcementService.update(id, req, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor) {
        announcementService.delete(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}