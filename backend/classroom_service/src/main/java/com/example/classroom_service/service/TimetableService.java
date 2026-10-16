package com.example.classroom_service.service;

import com.example.classroom_service.dto.TimetableEntryDTO;
import com.example.classroom_service.exception.ConflictException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.TimetableEntryMapper;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.model.TimetableEntry;
import com.example.classroom_service.repository.TimetableEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetableService {

    private final TimetableEntryRepository timetableRepo;
    private final TimetableEntryMapper mapper;
    private final ClassroomService classroomService;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public TimetableEntryDTO.Response create(TimetableEntryDTO.CreateRequest req) {
        Classroom classroom = classroomService.getOrThrow(req.getClassroomId());
        checkTimeConflict(req.getClassroomId(), req.getDay(),
                req.getStartTime(), req.getEndTime(), null);

        TimetableEntry entry = mapper.toEntity(req, classroom);
        return mapper.toResponse(timetableRepo.save(entry));
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public List<TimetableEntryDTO.Response> getByClassroom(Long classroomId) {
        return timetableRepo.findByClassroomIdOrderByDayAscStartTimeAsc(classroomId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<TimetableEntryDTO.WeeklyResponse> getWeeklyByClassroom(Long classroomId) {
        List<TimetableEntry> entries =
                timetableRepo.findByClassroomIdOrderByDayAscStartTimeAsc(classroomId);

        Map<DayOfWeek, List<TimetableEntryDTO.Response>> grouped = entries.stream()
                .collect(Collectors.groupingBy(
                        TimetableEntry::getDay,
                        Collectors.mapping(mapper::toResponse, Collectors.toList())
                ));

        return grouped.entrySet().stream()
                .map(e -> TimetableEntryDTO.WeeklyResponse.builder()
                        .day(e.getKey())
                        .slots(e.getValue())
                        .build())
                .sorted((a, b) -> a.getDay().ordinal() - b.getDay().ordinal())
                .collect(Collectors.toList());
    }

    public List<TimetableEntryDTO.Response> getDailyByClassroom(Long classroomId, DayOfWeek day) {
        return timetableRepo.findByClassroomIdAndDayOrderByStartTimeAsc(classroomId, day)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<TimetableEntryDTO.Response> getByFaculty(Long facultyId) {
        return timetableRepo.findByFacultyIdOrderByDayAscStartTimeAsc(facultyId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<TimetableEntryDTO.WeeklyResponse> getWeeklyByFaculty(Long facultyId) {
        List<TimetableEntry> entries =
                timetableRepo.findByFacultyIdOrderByDayAscStartTimeAsc(facultyId);

        Map<DayOfWeek, List<TimetableEntryDTO.Response>> grouped = entries.stream()
                .collect(Collectors.groupingBy(
                        TimetableEntry::getDay,
                        Collectors.mapping(mapper::toResponse, Collectors.toList())
                ));

        return grouped.entrySet().stream()
                .map(e -> TimetableEntryDTO.WeeklyResponse.builder()
                        .day(e.getKey())
                        .slots(e.getValue())
                        .build())
                .sorted((a, b) -> a.getDay().ordinal() - b.getDay().ordinal())
                .collect(Collectors.toList());
    }

    // ─── Update / Delete ──────────────────────────────────────────────────────

    @Transactional
    public TimetableEntryDTO.Response update(Long id, TimetableEntryDTO.UpdateRequest req) {
        TimetableEntry entry = getOrThrow(id);

        DayOfWeek day       = req.getDay()       != null ? req.getDay()       : entry.getDay();
        LocalTime startTime = req.getStartTime() != null ? req.getStartTime() : entry.getStartTime();
        LocalTime endTime   = req.getEndTime()   != null ? req.getEndTime()   : entry.getEndTime();

        checkTimeConflict(entry.getClassroom().getId(), day, startTime, endTime, id);
        mapper.updateEntity(entry, req);
        return mapper.toResponse(timetableRepo.save(entry));
    }

    @Transactional
    public void delete(Long id) {
        timetableRepo.delete(getOrThrow(id));
    }

    // ─── Conflict detection ───────────────────────────────────────────────────

    private void checkTimeConflict(Long classroomId, DayOfWeek day,
                                   LocalTime start, LocalTime end, Long excludeId) {
        List<TimetableEntry> existing =
                timetableRepo.findByClassroomIdAndDay(classroomId, day);

        boolean conflict = existing.stream()
                .filter(e -> excludeId == null || !e.getId().equals(excludeId))
                .anyMatch(e -> start.isBefore(e.getEndTime()) && end.isAfter(e.getStartTime()));

        if (conflict) {
            throw new ConflictException(
                    "Timetable conflict: another slot overlaps " + start + "–" + end + " on " + day);
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private TimetableEntry getOrThrow(Long id) {
        return timetableRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable entry not found: " + id));
    }
}
