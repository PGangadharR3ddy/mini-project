package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.TimetableEntryDTO;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.model.TimetableEntry;
import org.springframework.stereotype.Component;

@Component
public class TimetableEntryMapper {

    public TimetableEntry toEntity(TimetableEntryDTO.CreateRequest req, Classroom classroom) {
        return TimetableEntry.builder()
                .classroom(classroom)
                .day(req.getDay())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .subject(req.getSubject())
                .subjectCode(req.getSubjectCode())
                .type(req.getType() != null ? req.getType() : TimetableEntry.SlotType.LECTURE)
                .facultyId(req.getFacultyId())
                .facultyName(req.getFacultyName())
                .roomNumber(req.getRoomNumber())
                .build();
    }

    public TimetableEntryDTO.Response toResponse(TimetableEntry e) {
        return TimetableEntryDTO.Response.builder()
                .id(e.getId())
                .classroomId(e.getClassroom().getId())
                .day(e.getDay())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .subject(e.getSubject())
                .subjectCode(e.getSubjectCode())
                .type(e.getType())
                .facultyId(e.getFacultyId())
                .facultyName(e.getFacultyName())
                .roomNumber(e.getRoomNumber())
                .build();
    }

    public void updateEntity(TimetableEntry e, TimetableEntryDTO.UpdateRequest req) {
        if (req.getDay() != null)         e.setDay(req.getDay());
        if (req.getStartTime() != null)   e.setStartTime(req.getStartTime());
        if (req.getEndTime() != null)     e.setEndTime(req.getEndTime());
        if (req.getSubject() != null)     e.setSubject(req.getSubject());
        if (req.getSubjectCode() != null) e.setSubjectCode(req.getSubjectCode());
        if (req.getType() != null)        e.setType(req.getType());
        if (req.getFacultyId() != null)   e.setFacultyId(req.getFacultyId());
        if (req.getFacultyName() != null) e.setFacultyName(req.getFacultyName());
        if (req.getRoomNumber() != null)  e.setRoomNumber(req.getRoomNumber());
    }
}