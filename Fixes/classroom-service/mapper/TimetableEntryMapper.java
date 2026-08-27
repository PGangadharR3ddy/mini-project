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
                .facultyId(req.getFacultyId())
                .facultyName(req.getFacultyName())
                .roomNumber(req.getRoomNumber())
                .build();
    }

    public TimetableEntryDTO.Response toResponse(TimetableEntry entry) {
        return TimetableEntryDTO.Response.builder()
                .id(entry.getId())
                .classroomId(entry.getClassroom().getId())
                .day(entry.getDay())
                .startTime(entry.getStartTime())
                .endTime(entry.getEndTime())
                .subject(entry.getSubject())
                .facultyId(entry.getFacultyId())
                .facultyName(entry.getFacultyName())
                .roomNumber(entry.getRoomNumber())
                .build();
    }

    public void updateEntity(TimetableEntry entry, TimetableEntryDTO.UpdateRequest req) {
        if (req.getDay() != null)         entry.setDay(req.getDay());
        if (req.getStartTime() != null)   entry.setStartTime(req.getStartTime());
        if (req.getEndTime() != null)     entry.setEndTime(req.getEndTime());
        if (req.getSubject() != null)     entry.setSubject(req.getSubject());
        if (req.getFacultyId() != null)   entry.setFacultyId(req.getFacultyId());
        if (req.getFacultyName() != null) entry.setFacultyName(req.getFacultyName());
        if (req.getRoomNumber() != null)  entry.setRoomNumber(req.getRoomNumber());
    }
}
