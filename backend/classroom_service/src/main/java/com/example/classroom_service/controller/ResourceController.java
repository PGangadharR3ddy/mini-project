package com.example.classroom_service.controller;

import com.example.classroom_service.dto.ApiResponse;
import com.example.classroom_service.dto.ResourceDTO;
import com.example.classroom_service.model.Resource.ResourceType;
import com.example.classroom_service.security.UserPrincipal;
import com.example.classroom_service.service.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * Upload a file + metadata in a multipart request.
     * Form fields: classroomId, title, description, subject, type
     * File field:  file
     */
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> upload(
            @RequestPart("metadata") ResourceDTO.CreateRequest req,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource uploaded",
                        resourceService.upload(req, file, actor)));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<ApiResponse<Page<ResourceDTO.Response>>> getByClassroom(
            @PathVariable Long classroomId,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) ResourceType type,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                resourceService.filter(classroomId, subject, type, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(resourceService.getById(id)));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable Long id) {
        ResourceDTO.Response metadata = resourceService.getById(id);
        org.springframework.core.io.Resource file = resourceService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaTypeFactory.getMediaType(metadata.getFileName())
                        .orElse(MediaType.APPLICATION_OCTET_STREAM))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(metadata.getFileName(), StandardCharsets.UTF_8)
                        .build().toString())
                .body(file);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceDTO.Response>> update(
            @PathVariable Long id,
            @RequestBody ResourceDTO.UpdateRequest req,
            @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.ok(ApiResponse.success("Updated",
                resourceService.update(id, req, actor)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal actor) {
        resourceService.delete(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Deleted", null));
    }
}