package com.example.classroom_service.mapper;

import com.example.classroom_service.dto.ClassroomDTO;
import com.example.classroom_service.model.Classroom;
import org.springframework.stereotype.Component;

@Component
public class ClassroomMapper {

    public Classroom toEntity(ClassroomDTO.CreateRequest req) {
        return Classroom.builder()
                .name(req.getName())
                .section(req.getSection())
                .department(req.getDepartment())
                .year(req.getYear())
                .semester(req.getSemester())
                .build();
    }

    public ClassroomDTO.Response toResponse(Classroom classroom) {
        return ClassroomDTO.Response.builder()
                .id(classroom.getId())
                .name(classroom.getName())
                .section(classroom.getSection())
                .department(classroom.getDepartment())
                .year(classroom.getYear())
                .semester(classroom.getSemester())
                .build();
    }

    public void updateEntity(Classroom classroom, ClassroomDTO.UpdateRequest req) {
        if (req.getName() != null)       classroom.setName(req.getName());
        if (req.getSection() != null)    classroom.setSection(req.getSection());
        if (req.getDepartment() != null) classroom.setDepartment(req.getDepartment());
        if (req.getYear() != null)       classroom.setYear(req.getYear());
        if (req.getSemester() != null)   classroom.setSemester(req.getSemester());
    }
}