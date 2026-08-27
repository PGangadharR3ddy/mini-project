package com.example.classroom_service.service;

import com.example.classroom_service.dto.AcademicEventDTO;
import com.example.classroom_service.exception.AccessDeniedException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.AcademicEventMapper;
import com.example.classroom_service.model.AcademicEvent;
import com.example.classroom_service.model.AcademicEvent.EventType;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.repository.AcademicEventRepository;
import com.example.classroom_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademicEventService {

    private final AcademicEventRepository eventRepo;
    private final AcademicEventMapper mapper;
    private final ClassroomService classroomService;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public AcademicEventDTO.Response create(AcademicEventDTO.CreateRequest req,
                                            UserPrincipal actor) {
        Classroom classroom = classroomService.getOrThrow(req.getClassroomId());
        AcademicEvent event = mapper.toEntity(req, classroom, actor.getUserId(), actor.getName());

        AcademicEvent saved = eventRepo.save(event);

        // Google Calendar sync placeholder — wire up GoogleCalendarService later
        if (Boolean.TRUE.equals(req.getSyncToCalendar())) {
            // googleCalendarService.createEvent(saved);
            saved.setSyncedToCalendar(false); // will become true after real sync
        }

        return mapper.toResponse(saved);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public List<AcademicEventDTO.Response> getByClassroom(Long classroomId) {
        return eventRepo.findByClassroomIdOrderByEventDateTimeAsc(classroomId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<AcademicEventDTO.Response> getUpcoming(Long classroomId) {
        return eventRepo.findUpcomingByClassroom(classroomId, LocalDateTime.now())
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<AcademicEventDTO.Response> getByClassroomAndType(Long classroomId, EventType type) {
        return eventRepo.findByClassroomIdAndTypeOrderByEventDateTimeAsc(classroomId, type)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public List<AcademicEventDTO.Response> getByDateRange(Long classroomId,
                                                           LocalDateTime start,
                                                           LocalDateTime end) {
        return eventRepo.findByClassroomAndDateRange(classroomId, start, end)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    public AcademicEventDTO.Response getById(Long id) {
        return mapper.toResponse(getOrThrow(id));
    }

    // ─── Update / Delete ──────────────────────────────────────────────────────

    @Transactional
    public AcademicEventDTO.Response update(Long id, AcademicEventDTO.UpdateRequest req,
                                            UserPrincipal actor) {
        AcademicEvent event = getOrThrow(id);
        ensureOwnerOrAdmin(event, actor);
        mapper.updateEntity(event, req);

        // If date changed and event was synced, mark it as needing re-sync
        if (req.getEventDateTime() != null && Boolean.TRUE.equals(event.getSyncedToCalendar())) {
            event.setSyncedToCalendar(false);
        }

        return mapper.toResponse(eventRepo.save(event));
    }

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        AcademicEvent event = getOrThrow(id);
        ensureOwnerOrAdmin(event, actor);
        // If synced, remove from Google Calendar too
        // if (event.getSyncedToCalendar()) googleCalendarService.deleteEvent(event);
        eventRepo.delete(event);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private AcademicEvent getOrThrow(Long id) {
        return eventRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found: " + id));
    }

    private void ensureOwnerOrAdmin(AcademicEvent event, UserPrincipal actor) {
        boolean isOwner = event.getCreatedBy().equals(actor.getUserId());
        boolean isAdmin = "ADMIN".equals(actor.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this event.");
        }
    }
}
