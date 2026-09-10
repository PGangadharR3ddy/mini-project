package com.example.classroom_service.service;

import com.example.classroom_service.dto.ClassroomDTO;
import com.example.classroom_service.dto.TimetableEntryDTO;
import com.example.classroom_service.dto.AnnouncementDTO;
import com.example.classroom_service.dto.AcademicEventDTO;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.ClassroomMapper;
import com.example.classroom_service.mapper.TimetableEntryMapper;
import com.example.classroom_service.mapper.AnnouncementMapper;
import com.example.classroom_service.mapper.AcademicEventMapper;
import com.example.classroom_service.model.AcademicEvent;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.repository.ClassroomRepository;
import com.example.classroom_service.repository.TimetableEntryRepository;
import com.example.classroom_service.repository.AnnouncementRepository;
import com.example.classroom_service.repository.AcademicEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClassroomService {

    private final ClassroomRepository classroomRepo;
    private final TimetableEntryRepository timetableRepo;
    private final AnnouncementRepository announcementRepo;
    private final AcademicEventRepository eventRepo;
    private final ClassroomMapper classroomMapper;
    private final TimetableEntryMapper timetableMapper;
    private final AnnouncementMapper announcementMapper;
    private final AcademicEventMapper eventMapper;

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    @Transactional
    public ClassroomDTO.Response create(ClassroomDTO.CreateRequest req) {
        Classroom classroom = classroomMapper.toEntity(req);
        return classroomMapper.toResponse(classroomRepo.save(classroom));
    }

    public ClassroomDTO.Response findById(Long id) {
        return classroomMapper.toResponse(getOrThrow(id));
    }

    public List<ClassroomDTO.Response> findAll() {
        return classroomRepo.findAll().stream()
                .map(classroomMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<ClassroomDTO.Response> findByDepartment(String department) {
        return classroomRepo.findByDepartment(department).stream()
                .map(classroomMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClassroomDTO.Response update(Long id, ClassroomDTO.UpdateRequest req) {
        Classroom classroom = getOrThrow(id);
        classroomMapper.updateEntity(classroom, req);
        return classroomMapper.toResponse(classroomRepo.save(classroom));
    }

    @Transactional
    public void delete(Long id) {
        classroomRepo.delete(getOrThrow(id));
    }

    // ─── Detail view (timetable + announcements + upcoming events) ────────────

    public ClassroomDTO.DetailResponse getDetail(Long id) {
    Classroom classroom = getOrThrow(id);

    List<TimetableEntryDTO.Response> timetable = timetableRepo
            .findByClassroomIdOrderByDayAscStartTimeAsc(id).stream()
            .map(timetableMapper::toResponse)
            .collect(Collectors.toList());

    List<AnnouncementDTO.Response> announcements = announcementRepo
            .findByClassroomIdOrderByCreatedAtDesc(id, PageRequest.of(0, 5))
            .stream()
            .map(announcementMapper::toResponse)
            .collect(Collectors.toList());

    List<AcademicEventDTO.Response> upcomingEvents = eventRepo
            .findUpcomingByClassroom(id, LocalDateTime.now()).stream()
            .limit(5)
            .map(eventMapper::toResponse)
            .collect(Collectors.toList());

    return ClassroomDTO.DetailResponse.builder()
            .id(classroom.getId())
            .name(classroom.getName())
            .section(classroom.getSection())
            .department(classroom.getDepartment())
            .year(classroom.getYear())
            .semester(classroom.getSemester())
            .capacity(classroom.getCapacity())
            .studentCount(classroom.getStudentCount())
            .academicYear(classroom.getAcademicYear())
            .advisorName(classroom.getAdvisorName())
            .advisorEmail(classroom.getAdvisorEmail())
            .classroomNumber(classroom.getClassroomNumber())
            .syllabusProgress(classroom.getSyllabusProgress())
            .totalLecturesToday(classroom.getTotalLecturesToday())
            .pendingGrading(classroom.getPendingGrading())
            .timetable(timetable)
            .announcements(announcements)
            .upcomingEvents(upcomingEvents)
            .build();
}

    // ─── Helper ───────────────────────────────────────────────────────────────

    public Classroom getOrThrow(Long id) {
        return classroomRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found: " + id));
    }
}