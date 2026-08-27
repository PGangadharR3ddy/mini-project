package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "academic_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType type;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private LocalDateTime eventDateTime;

    @Column
    private Integer durationMinutes;

    @Column
    private String venue;

    @Column
    private String googleCalendarEventId;

    @Builder.Default
    @Column(nullable = false)
    private Boolean syncedToCalendar = false;

    @Column(nullable = false)
    private Long createdBy;

    @Column
    private String createdByName;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum EventType {
        TEST, ASSIGNMENT, PRESENTATION, VIVA, OTHER
    }
}
