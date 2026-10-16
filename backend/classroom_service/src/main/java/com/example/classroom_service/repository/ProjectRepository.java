package com.example.classroom_service.repository;

import com.example.classroom_service.model.Project;
import com.example.classroom_service.model.Project.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // All projects in a classroom
    Page<Project> findByClassroomIdOrderByCreatedAtDesc(Long classroomId, Pageable pageable);

    // All projects by department
    Page<Project> findByDepartmentOrderByCreatedAtDesc(String department, Pageable pageable);

    // All open projects across all departments
    Page<Project> findByStatusOrderByCreatedAtDesc(ProjectStatus status, Pageable pageable);

    // All projects (cross-department discovery)
    Page<Project> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // Filter by status within a classroom
    Page<Project> findByClassroomIdAndStatusOrderByCreatedAtDesc(
            Long classroomId, ProjectStatus status, Pageable pageable);

    // Filter by department and status
    Page<Project> findByDepartmentAndStatusOrderByCreatedAtDesc(
            String department, ProjectStatus status, Pageable pageable);

    // Search by tech stack or tags
    @Query("""
        SELECT p FROM Project p
        WHERE LOWER(p.techStack) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(p.tags) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY p.createdAt DESC
    """)
    Page<Project> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Projects posted by a specific user
    List<Project> findByPostedByOrderByCreatedAtDesc(Long postedBy);

    // Projects a student is a member of
    @Query("""
        SELECT p FROM Project p
        JOIN p.members m
        WHERE m.studentId = :studentId
        ORDER BY p.createdAt DESC
    """)
    List<Project> findProjectsByMember(@Param("studentId") Long studentId);
}