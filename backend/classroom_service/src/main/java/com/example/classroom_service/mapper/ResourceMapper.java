package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.ResourceDTO;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.Resource;
import org.springframework.stereotype.Component;

@Component
public class ResourceMapper {

    public Resource toEntity(ResourceDTO.CreateRequest req,
                             Classroom classroom,
                             String fileUrl,
                             String fileName,
                             Long fileSizeBytes,
                             Long uploadedBy,
                             String uploadedByName) {
        return Resource.builder()
                .classroom(classroom)
                .title(req.getTitle())
                .description(req.getDescription())
                .subject(req.getSubject())
                .type(req.getType())
                .fileUrl(fileUrl)
                .fileName(fileName)
                .fileSizeBytes(fileSizeBytes)
                .uploadedBy(uploadedBy)
                .uploadedByName(uploadedByName)
                .build();
    }

    public ResourceDTO.Response toResponse(Resource r) {
        return ResourceDTO.Response.builder()
                .id(r.getId())
                .classroomId(r.getClassroom().getId())
                .title(r.getTitle())
                .description(r.getDescription())
                .subject(r.getSubject())
                .type(r.getType())
                .fileUrl(r.getFileUrl())
                .fileName(r.getFileName())
                .fileSizeBytes(r.getFileSizeBytes())
                .uploadedBy(r.getUploadedBy())
                .uploadedByName(r.getUploadedByName())
                .uploadedAt(r.getUploadedAt())
                .build();
    }

    public void updateEntity(Resource r, ResourceDTO.UpdateRequest req) {
        if (req.getTitle() != null)       r.setTitle(req.getTitle());
        if (req.getDescription() != null) r.setDescription(req.getDescription());
        if (req.getType() != null)        r.setType(req.getType());
    }
}