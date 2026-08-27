package com.example.classroom_service.controller;

import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.dto.ClassroomDTO;
import com.example.classroom_service.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    public ResponseEntity<ApiResponse<ClassroomDTO.Response>> create(
            @RequestBody ClassroomDTO.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Classroom created", classroomService.create(req)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassroomDTO.Response>>> getAll(
            @RequestParam(required = false) String department) {
        List<ClassroomDTO.Response> result = department != null
                ? classroomService.findByDepartment(department)
                : classroomService.findAll();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassroomDTO.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(classroomService.findById(id)));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ApiResponse<ClassroomDTO.DetailResponse>> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(classroomService.getDetail(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassroomDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody ClassroomDTO.UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Classroom updated", classroomService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        classroomService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Classroom deleted", null));
    }
}
