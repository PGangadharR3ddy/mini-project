package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column
    private String techStack;

    @Column
    private String repoUrl;

    @Column
    private String liveUrl;

    @Column
    private Integer teamSize;

    @Column
    private String tags;               // comma-separated e.g. "AI,Web,Mobile"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.OPEN;

    // nullable — null means open to all departments
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @Column
    private String department;         // denormalized for filtering

    @Column(nullable = false)
    private Long postedBy;

    @Column(nullable = false)
    private String postedByName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostedByRole postedByRole;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectMember> members;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JoinRequest> joinRequests;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ProjectStatus {
        OPEN, IN_PROGRESS, COMPLETED, CLOSED
    }

    public enum PostedByRole {
        STUDENT, FACULTY, ADMIN
    }
}