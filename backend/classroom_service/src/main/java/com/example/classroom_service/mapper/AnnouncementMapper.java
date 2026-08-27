package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.AnnouncementDTO;
import com.example.classroom_service.model.Announcement;
import com.example.classroom_service.model.Classroom;
import org.springframework.stereotype.Component;

@Component
public class AnnouncementMapper {

    public Announcement toEntity(AnnouncementDTO.CreateRequest req,
                                 Classroom classroom,
                                 Long createdBy,
                                 String createdByName) {
        return Announcement.builder()
                .classroom(classroom)
                .department(req.getDepartment())
                .title(req.getTitle())
                .body(req.getBody())
                .type(req.getType())
                .createdBy(createdBy)
                .createdByName(createdByName)
                .build();
    }

    public AnnouncementDTO.Response toResponse(Announcement a) {
        return AnnouncementDTO.Response.builder()
                .id(a.getId())
                .classroomId(a.getClassroom() != null ? a.getClassroom().getId() : null)
                .department(a.getDepartment())
                .title(a.getTitle())
                .body(a.getBody())
                .type(a.getType())
                .createdBy(a.getCreatedBy())
                .createdByName(a.getCreatedByName())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    public void updateEntity(Announcement a, AnnouncementDTO.UpdateRequest req) {
        if (req.getTitle() != null) a.setTitle(req.getTitle());
        if (req.getBody() != null)  a.setBody(req.getBody());
    }
}