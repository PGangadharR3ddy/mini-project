package com.example.classroom_service.repository;

import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.model.TimetableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableEntryRepository extends JpaRepository<TimetableEntry, Long> {

    List<TimetableEntry> findByClassroomIdOrderByDayAscStartTimeAsc(Long classroomId);

    List<TimetableEntry> findByClassroomIdAndDayOrderByStartTimeAsc(Long classroomId, DayOfWeek day);

    List<TimetableEntry> findByFacultyIdOrderByDayAscStartTimeAsc(Long facultyId);

    List<TimetableEntry> findByFacultyIdAndDayOrderByStartTimeAsc(Long facultyId, DayOfWeek day);

    List<TimetableEntry> findByClassroomIdAndDay(Long classroomId, DayOfWeek day);
}
