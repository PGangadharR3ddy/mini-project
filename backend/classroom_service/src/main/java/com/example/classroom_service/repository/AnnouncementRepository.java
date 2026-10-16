package com.example.classroom_service.repository;

import com.example.classroom_service.model.Announcement;
import com.example.classroom_service.model.Announcement.AnnouncementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // Announcements for a specific section
    Page<Announcement> findByClassroomIdOrderByCreatedAtDesc(Long classroomId, Pageable pageable);

    // Department-level announcements
    Page<Announcement> findByDepartmentAndTypeOrderByCreatedAtDesc(
            String department, AnnouncementType type, Pageable pageable);

    // Everything visible to a student: their section + their dept + GENERAL
    @Query("""
        SELECT a FROM Announcement a
        WHERE (a.classroom.id = :classroomId)
           OR (a.department = :department AND a.type = 'DEPARTMENT')
           OR (a.type = 'GENERAL')
        ORDER BY a.createdAt DESC
    """)
    Page<Announcement> findAllVisibleToStudent(
            @Param("classroomId") Long classroomId,
            @Param("department") String department,
            Pageable pageable);

    // All announcements created by a faculty member
    List<Announcement> findByCreatedByOrderByCreatedAtDesc(Long createdBy);
}