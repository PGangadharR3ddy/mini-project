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
                .capacity(req.getCapacity())
                .studentCount(req.getStudentCount())
                .academicYear(req.getAcademicYear())
                .advisorName(req.getAdvisorName())
                .advisorEmail(req.getAdvisorEmail())
                .classroomNumber(req.getClassroomNumber())
                .syllabusProgress(req.getSyllabusProgress())
                .totalLecturesToday(req.getTotalLecturesToday())
                .pendingGrading(req.getPendingGrading())
                .build();
    }

    public ClassroomDTO.Response toResponse(Classroom c) {
        return ClassroomDTO.Response.builder()
                .id(c.getId())
                .name(c.getName())
                .section(c.getSection())
                .department(c.getDepartment())
                .year(c.getYear())
                .semester(c.getSemester())
                .capacity(c.getCapacity())
                .studentCount(c.getStudentCount())
                .academicYear(c.getAcademicYear())
                .advisorName(c.getAdvisorName())
                .advisorEmail(c.getAdvisorEmail())
                .classroomNumber(c.getClassroomNumber())
                .syllabusProgress(c.getSyllabusProgress())
                .totalLecturesToday(c.getTotalLecturesToday())
                .pendingGrading(c.getPendingGrading())
                .build();
    }

    public void updateEntity(Classroom c, ClassroomDTO.UpdateRequest req) {
        if (req.getName() != null)               c.setName(req.getName());
        if (req.getSection() != null)            c.setSection(req.getSection());
        if (req.getDepartment() != null)         c.setDepartment(req.getDepartment());
        if (req.getYear() != null)               c.setYear(req.getYear());
        if (req.getSemester() != null)           c.setSemester(req.getSemester());
        if (req.getCapacity() != null)           c.setCapacity(req.getCapacity());
        if (req.getStudentCount() != null)       c.setStudentCount(req.getStudentCount());
        if (req.getAcademicYear() != null)       c.setAcademicYear(req.getAcademicYear());
        if (req.getAdvisorName() != null)        c.setAdvisorName(req.getAdvisorName());
        if (req.getAdvisorEmail() != null)       c.setAdvisorEmail(req.getAdvisorEmail());
        if (req.getClassroomNumber() != null)    c.setClassroomNumber(req.getClassroomNumber());
        if (req.getSyllabusProgress() != null)   c.setSyllabusProgress(req.getSyllabusProgress());
        if (req.getTotalLecturesToday() != null) c.setTotalLecturesToday(req.getTotalLecturesToday());
        if (req.getPendingGrading() != null)     c.setPendingGrading(req.getPendingGrading());
    }
}