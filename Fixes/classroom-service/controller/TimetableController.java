package com.example.classroom_service.controller;

import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.dto.TimetableEntryDTO;
import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableService timetableService;

    @PostMapping
    public ResponseEntity<ApiResponse<TimetableEntryDTO.Response>> create(
            @RequestBody TimetableEntryDTO.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Slot added", timetableService.create(req)));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<List<TimetableEntryDTO.Response>>> getByClassroom(
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getByClassroom(classroomId)));
    }

    @GetMapping("/classroom/{classroomId}/weekly")
    public ResponseEntity<ApiResponse<List<TimetableEntryDTO.WeeklyResponse>>> getWeeklyByClassroom(
            @PathVariable Long classroomId) {
        return ResponseEntity.ok(ApiResponse.success(
                timetableService.getWeeklyByClassroom(classroomId)));
    }

    @GetMapping("/classroom/{classroomId}/day/{day}")
    public ResponseEntity<ApiResponse<List<TimetableEntryDTO.Response>>> getDailyByClassroom(
            @PathVariable Long classroomId,
            @PathVariable DayOfWeek day) {
        return ResponseEntity.ok(ApiResponse.success(
                timetableService.getDailyByClassroom(classroomId, day)));
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<ApiResponse<List<TimetableEntryDTO.Response>>> getByFaculty(
            @PathVariable Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success(timetableService.getByFaculty(facultyId)));
    }

    @GetMapping("/faculty/{facultyId}/weekly")
    public ResponseEntity<ApiResponse<List<TimetableEntryDTO.WeeklyResponse>>> getWeeklyByFaculty(
            @PathVariable Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success(
                timetableService.getWeeklyByFaculty(facultyId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimetableEntryDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody TimetableEntryDTO.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Slot updated", timetableService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        timetableService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Slot deleted", null));
    }
}
