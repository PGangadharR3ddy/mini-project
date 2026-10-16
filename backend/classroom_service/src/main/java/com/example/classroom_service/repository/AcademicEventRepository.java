package com.example.classroom_service.repository;

import com.example.classroom_service.model.AcademicEvent;
import com.example.classroom_service.model.AcademicEvent.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, Long> {

    List<AcademicEvent> findByClassroomIdOrderByEventDateTimeAsc(Long classroomId);

    List<AcademicEvent> findByClassroomIdAndTypeOrderByEventDateTimeAsc(
            Long classroomId, EventType type);

    // Upcoming events for a classroom (from now onward)
    @Query("""
        SELECT e FROM AcademicEvent e
        WHERE e.classroom.id = :classroomId
          AND e.eventDateTime >= :from
        ORDER BY e.eventDateTime ASC
    """)
    List<AcademicEvent> findUpcomingByClassroom(
            @Param("classroomId") Long classroomId,
            @Param("from") LocalDateTime from);

    // Events within a date range for a classroom
    @Query("""
        SELECT e FROM AcademicEvent e
        WHERE e.classroom.id = :classroomId
          AND e.eventDateTime BETWEEN :start AND :end
        ORDER BY e.eventDateTime ASC
    """)
    List<AcademicEvent> findByClassroomAndDateRange(
            @Param("classroomId") Long classroomId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    // Events not yet synced to Google Calendar
    List<AcademicEvent> findBySyncedToCalendarFalse();
}