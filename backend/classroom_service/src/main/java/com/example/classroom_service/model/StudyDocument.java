package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "study_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The UUID returned by FastAPI — used to call /documents/{id}/ask
    @Column(nullable = false, unique = true)
    private String documentId;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private Long uploadedBy;

    @Column
    private String uploadedByName;

    @Column
    private Integer pagesProcessed;

    @Column
    private Integer chunksIndexed;

    // Optional — link document to a classroom
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}