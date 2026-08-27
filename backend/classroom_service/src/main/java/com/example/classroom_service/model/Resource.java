
package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(nullable = false)
    private String title;

    @Column
    private String description;

    @Column(nullable = false)
    private String subject;             // e.g. "DBMS"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType type;          // NOTES, PPT, ASSIGNMENT, REFERENCE, RECORDED_LECTURE

    @Column(nullable = false)
    private String fileUrl;             // path or URL to stored file

    @Column
    private String fileName;            // original file name

    @Column
    private Long fileSizeBytes;

    @Column(nullable = false)
    private Long uploadedBy;            // faculty user id

    @Column
    private String uploadedByName;      // denormalized

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    public enum ResourceType {
        NOTES, PPT, ASSIGNMENT, REFERENCE, RECORDED_LECTURE
    }
}
