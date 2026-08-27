package com.example.classroom_service.service;

import com.example.classroom_service.config.FileStorageConfig;
import com.example.classroom_service.dto.ResourceDTO;
import com.example.classroom_service.exception.AccessDeniedException;
import com.example.classroom_service.exception.FileStorageException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.ResourceMapper;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.Resource;
import com.example.classroom_service.model.Resource.ResourceType;
import com.example.classroom_service.repository.ResourceRepository;
import com.example.classroom_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceService {

    private final ResourceRepository resourceRepo;
    private final ResourceMapper mapper;
    private final ClassroomService classroomService;
    private final FileStorageConfig storageConfig;

    // ─── Upload & Create ──────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO.Response upload(ResourceDTO.CreateRequest req,
                                       MultipartFile file,
                                       UserPrincipal actor) {
        Classroom classroom = classroomService.getOrThrow(req.getClassroomId());

        String fileUrl  = storeFile(file, req.getClassroomId());
        String fileName = file.getOriginalFilename();
        long   fileSize = file.getSize();

        Resource resource = mapper.toEntity(req, classroom, fileUrl, fileName,
                fileSize, actor.getUserId(), actor.getName());

        return mapper.toResponse(resourceRepo.save(resource));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public Page<ResourceDTO.Response> getByClassroom(Long classroomId, Pageable pageable) {
        return resourceRepo
                .findByClassroomIdOrderByUploadedAtDesc(classroomId, pageable)
                .map(mapper::toResponse);
    }

    public Page<ResourceDTO.Response> filter(Long classroomId,
                                             String subject,
                                             ResourceType type,
                                             Pageable pageable) {
        if (subject != null && type != null) {
            return resourceRepo
                    .findByClassroomIdAndSubjectAndTypeOrderByUploadedAtDesc(
                            classroomId, subject, type, pageable)
                    .map(mapper::toResponse);
        } else if (subject != null) {
            return resourceRepo
                    .findByClassroomIdAndSubjectOrderByUploadedAtDesc(classroomId, subject, pageable)
                    .map(mapper::toResponse);
        } else if (type != null) {
            return resourceRepo
                    .findByClassroomIdAndTypeOrderByUploadedAtDesc(classroomId, type, pageable)
                    .map(mapper::toResponse);
        }
        return getByClassroom(classroomId, pageable);
    }

    public ResourceDTO.Response getById(Long id) {
        return mapper.toResponse(getOrThrow(id));
    }

    // ─── Update metadata ──────────────────────────────────────────────────────

    @Transactional
    public ResourceDTO.Response update(Long id, ResourceDTO.UpdateRequest req, UserPrincipal actor) {
        Resource r = getOrThrow(id);
        ensureOwnerOrAdmin(r, actor);
        mapper.updateEntity(r, req);
        return mapper.toResponse(resourceRepo.save(r));
    }

    // ─── Delete (file + DB record) ────────────────────────────────────────────

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        Resource r = getOrThrow(id);
        ensureOwnerOrAdmin(r, actor);
        deleteFile(r.getFileUrl());
        resourceRepo.delete(r);
    }

    // ─── File storage helpers ─────────────────────────────────────────────────

    private String storeFile(MultipartFile file, Long classroomId) {
        try {
            Path dir = Paths.get(storageConfig.getUploadDir(), "classroom-" + classroomId)
                    .toAbsolutePath().normalize();
            Files.createDirectories(dir);

            String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path target = dir.resolve(uniqueName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return target.toString();
        } catch (IOException e) {
            throw new FileStorageException("Failed to store file: " + e.getMessage());
        }
    }

    private void deleteFile(String fileUrl) {
        try {
            Files.deleteIfExists(Paths.get(fileUrl));
        } catch (IOException e) {
            // log warning but don't fail the transaction
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Resource getOrThrow(Long id) {
        return resourceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));
    }

    private void ensureOwnerOrAdmin(Resource r, UserPrincipal actor) {
        boolean isOwner = r.getUploadedBy().equals(actor.getUserId());
        boolean isAdmin = "ADMIN".equals(actor.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this resource.");
        }
    }
}
