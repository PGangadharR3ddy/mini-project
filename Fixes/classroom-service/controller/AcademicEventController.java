package com.example.classroom_service.controller;

import com.example.classroom_service.dto.AcademicEventDTO;
import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.model.AcademicEvent.EventType;
import com.example.classroom_service.security.UserPrincipal;
import com.example.classroom_service.service.AcademicEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class AcademicEventController {

    private final AcademicEventService eventService;

    @PostMapping
    public ResponseEntity<ApiResponse<AcademicEventDTO.Response>> create(
            @RequestBody AcademicEventDTO.CreateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created", eventService.create(req, actor)));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<List<AcademicEventDTO.Response>>> getByClassroom(
            @PathVariable Long classroomId,
            @RequestParam(required = false) EventType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        List<AcademicEventDTO.Response> result;

        if (from != null && to != null) {
            result = eventService.getByDateRange(classroomId, from, to);
        } else if (type != null) {
            result = eventService.getByClassroomAndType(classroomId, type);
        } else {
            result = eventService.getByClassroom(classroomId);
        }

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/classroom/{classroomId}/upcoming")
    public ResponseEntity<ApiResponse<List<AcademicEventDTO.Response>>> getUpcoming(
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getUpcoming(classroomId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AcademicEventDTO.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AcademicEventDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody AcademicEventDTO.UpdateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Event updated",
                eventService.update(id, req, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor) {
        eventService.delete(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Event deleted", null));
    }
}
