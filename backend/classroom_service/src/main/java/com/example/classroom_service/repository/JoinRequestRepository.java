package com.example.classroom_service.repository;

import com.example.classroom_service.model.JoinRequest;
import com.example.classroom_service.model.JoinRequest.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {

    // All requests for a project (for project owner to review)
    List<JoinRequest> findByProjectIdOrderByRequestedAtDesc(Long projectId);

    // All requests for a project filtered by status
    List<JoinRequest> findByProjectIdAndStatusOrderByRequestedAtDesc(
            Long projectId, RequestStatus status);

    // All requests made by a student
    List<JoinRequest> findByRequestedByOrderByRequestedAtDesc(Long requestedBy);

    // Check if a student already requested to join a project
    Optional<JoinRequest> findByProjectIdAndRequestedBy(Long projectId, Long requestedBy);

    // Pending requests for a project
    List<JoinRequest> findByProjectIdAndStatus(Long projectId, RequestStatus status);
}