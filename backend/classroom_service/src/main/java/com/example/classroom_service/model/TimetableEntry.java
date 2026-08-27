package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "timetable_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek day;              // MON, TUE, WED, THU, FRI, SAT

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String subject;             // e.g. "Operating Systems"

    @Column(nullable = false)
    private Long facultyId;             // references user-service

    @Column
    private String facultyName;         // denormalized for display speed

    @Column
    private String roomNumber;          // e.g. "Lab 3", "Room 201"

    // DayOfWeek enum is defined as a top-level enum in model/DayOfWeek.java
}