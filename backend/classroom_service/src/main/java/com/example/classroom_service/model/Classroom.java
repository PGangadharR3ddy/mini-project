package com.example.classroom_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "classrooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;           // e.g. "CSE - A"

    @Column(nullable = false)
    private String section;        // e.g. "A", "B"

    @Column(nullable = false)
    private String department;     // e.g. "CSE", "ECE"

    @Column(name = "year_", nullable = false)
    private Integer year;          // 1, 2, 3, 4

    @Column(nullable = false)
    private Integer semester;      // 1 to 8

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TimetableEntry> timetableEntries;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Announcement> announcements;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Resource> resources;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AcademicEvent> academicEvents;
}