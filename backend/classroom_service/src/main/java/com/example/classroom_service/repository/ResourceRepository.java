package com.example.classroom_service.repository;

import com.example.classroom_service.model.Resource;
import com.example.classroom_service.model.Resource.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    Page<Resource> findByClassroomIdOrderByUploadedAtDesc(Long classroomId, Pageable pageable);

    Page<Resource> findByClassroomIdAndSubjectOrderByUploadedAtDesc(
            Long classroomId, String subject, Pageable pageable);

    Page<Resource> findByClassroomIdAndTypeOrderByUploadedAtDesc(
            Long classroomId, ResourceType type, Pageable pageable);

    Page<Resource> findByClassroomIdAndSubjectAndTypeOrderByUploadedAtDesc(
            Long classroomId, String subject, ResourceType type, Pageable pageable);

    List<Resource> findByUploadedByOrderByUploadedAtDesc(Long uploadedBy);
}