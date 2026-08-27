package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.AcademicEventDTO;
import com.example.classroom_service.model.AcademicEvent;
import com.example.classroom_service.model.Classroom;
import org.springframework.stereotype.Component;

@Component
public class AcademicEventMapper {

    public AcademicEvent toEntity(AcademicEventDTO.CreateRequest req,
                                  Classroom classroom,
                                  Long createdBy,
                                  String createdByName) {
        return AcademicEvent.builder()
                .classroom(classroom)
                .title(req.getTitle())
                .description(req.getDescription())
                .type(req.getType())
                .subject(req.getSubject())
                .eventDateTime(req.getEventDateTime())
                .durationMinutes(req.getDurationMinutes())
                .venue(req.getVenue())
                .syncedToCalendar(false)
                .createdBy(createdBy)
                .createdByName(createdByName)
                .build();
    }

    public AcademicEventDTO.Response toResponse(AcademicEvent e) {
        return AcademicEventDTO.Response.builder()
                .id(e.getId())
                .classroomId(e.getClassroom().getId())
                .classroomName(e.getClassroom().getName())
                .title(e.getTitle())
                .description(e.getDescription())
                .type(e.getType())
                .subject(e.getSubject())
                .eventDateTime(e.getEventDateTime())
                .durationMinutes(e.getDurationMinutes())
                .venue(e.getVenue())
                .googleCalendarEventId(e.getGoogleCalendarEventId())
                .syncedToCalendar(e.getSyncedToCalendar())
                .createdBy(e.getCreatedBy())
                .createdByName(e.getCreatedByName())
                .createdAt(e.getCreatedAt())
                .build();
    }

    public void updateEntity(AcademicEvent e, AcademicEventDTO.UpdateRequest req) {
        if (req.getTitle() != null)           e.setTitle(req.getTitle());
        if (req.getDescription() != null)     e.setDescription(req.getDescription());
        if (req.getType() != null)            e.setType(req.getType());
        if (req.getSubject() != null)         e.setSubject(req.getSubject());
        if (req.getEventDateTime() != null)   e.setEventDateTime(req.getEventDateTime());
        if (req.getDurationMinutes() != null) e.setDurationMinutes(req.getDurationMinutes());
        if (req.getVenue() != null)           e.setVenue(req.getVenue());
    }
}