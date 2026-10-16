package com.example.classroom_service.repository;

import com.example.classroom_service.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    List<Classroom> findByDepartment(String department);

    List<Classroom> findByDepartmentAndYear(String department, Integer year);

    List<Classroom> findByDepartmentAndSection(String department, String section);

    Optional<Classroom> findByDepartmentAndSectionAndSemester(
            String department, String section, Integer semester);
}