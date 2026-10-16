package com.example.classroom_service.service;

import com.example.classroom_service.dto.AnnouncementDTO;
import com.example.classroom_service.exception.AccessDeniedException;
import com.example.classroom_service.exception.ResourceNotFoundException;
import com.example.classroom_service.mapper.AnnouncementMapper;
import com.example.classroom_service.model.Announcement;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.repository.AnnouncementRepository;
import com.example.classroom_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final AnnouncementRepository announcementRepo;
    private final AnnouncementMapper mapper;
    private final ClassroomService classroomService;

    // ─── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public AnnouncementDTO.Response create(AnnouncementDTO.CreateRequest req, UserPrincipal actor) {
        Classroom classroom = req.getClassroomId() != null
                ? classroomService.getOrThrow(req.getClassroomId())
                : null;

        Announcement saved = announcementRepo.save(
                mapper.toEntity(req, classroom, actor.getUserId(), actor.getName()));

        return mapper.toResponse(saved);
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    public Page<AnnouncementDTO.Response> getByClassroom(Long classroomId, Pageable pageable) {
        return announcementRepo
                .findByClassroomIdOrderByCreatedAtDesc(classroomId, pageable)
                .map(mapper::toResponse);
    }

    public Page<AnnouncementDTO.Response> getAllVisibleToStudent(
            Long classroomId, String department, Pageable pageable) {
        return announcementRepo
                .findAllVisibleToStudent(classroomId, department, pageable)
                .map(mapper::toResponse);
    }

    public AnnouncementDTO.Response getById(Long id) {
        return mapper.toResponse(getOrThrow(id));
    }

    // ─── Update / Delete ──────────────────────────────────────────────────────

    @Transactional
    public AnnouncementDTO.Response update(Long id, AnnouncementDTO.UpdateRequest req,
                                           UserPrincipal actor) {
        Announcement a = getOrThrow(id);
        ensureOwnerOrAdmin(a, actor);
        mapper.updateEntity(a, req);
        return mapper.toResponse(announcementRepo.save(a));
    }

    @Transactional
    public void delete(Long id, UserPrincipal actor) {
        Announcement a = getOrThrow(id);
        ensureOwnerOrAdmin(a, actor);
        announcementRepo.delete(a);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Announcement getOrThrow(Long id) {
        return announcementRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));
    }

    private void ensureOwnerOrAdmin(Announcement a, UserPrincipal actor) {
        boolean isOwner = a.getCreatedBy().equals(actor.getUserId());
        boolean isAdmin = "ADMIN".equals(actor.getRole());
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You do not have permission to modify this announcement.");
        }
    }
}