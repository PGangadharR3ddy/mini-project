package com.example.classroom_service.repository;

import com.example.classroom_service.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectId(Long projectId);

    Optional<ProjectMember> findByProjectIdAndStudentId(Long projectId, Long studentId);

    boolean existsByProjectIdAndStudentId(Long projectId, Long studentId);

    int countByProjectId(Long projectId);

    List<ProjectMember> findByStudentId(Long studentId);
}