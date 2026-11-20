package com.example.classroom_service.config;

import com.example.classroom_service.model.AcademicEvent;
import com.example.classroom_service.model.Announcement;
import com.example.classroom_service.model.Classroom;
import com.example.classroom_service.model.DayOfWeek;
import com.example.classroom_service.model.Resource;
import com.example.classroom_service.model.TimetableEntry;
import com.example.classroom_service.repository.AcademicEventRepository;
import com.example.classroom_service.repository.AnnouncementRepository;
import com.example.classroom_service.repository.ClassroomRepository;
import com.example.classroom_service.repository.ResourceRepository;
import com.example.classroom_service.repository.TimetableEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@Profile("demo")
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private final ClassroomRepository classroomRepository;
    private final TimetableEntryRepository timetableEntryRepository;
    private final AnnouncementRepository announcementRepository;
    private final ResourceRepository resourceRepository;
    private final AcademicEventRepository academicEventRepository;
    private final FileStorageConfig fileStorageConfig;

    @Override
    @Transactional
    public void run(String... args) throws IOException {
        if (hasExistingData()) {
            log.info("Demo seed skipped because classroom data already exists.");
            return;
        }

        List<Classroom> classrooms = classroomRepository.saveAll(List.of(
                classroom("CSE - A", "A", "CSE", 2, 3, 120, 114, "2024-2025",
                        "Dr. Sarah Müller", "s.muller@bauhaus.edu", "Hall C", 75, 3, 42),
                classroom("CSE - B", "B", "CSE", 2, 3, 120, 108, "2024-2025",
                        "Prof. J. Albers", "j.albers@bauhaus.edu", "Rm 301", 68, 2, 19),
                classroom("ECE - Final Year", "A", "ECE", 4, 7, 80, 76, "2024-2025",
                        "Dr. K. Chen", "k.chen@bauhaus.edu", "Lab 4", 82, 4, 35),
                classroom("Mechanical - Sophomores", "A", "MECH", 2, 4, 90, 88, "2024-2025",
                        "Prof. P. Klee", "p.klee@bauhaus.edu", "Studio 2", 60, 3, 28),
                classroom("AIML-B", "B", "AIML", 2, 3, 100, 0, "2024-2025",
                        null, null, null, 0, 0, 0)
        ));
        Classroom firstClassroom = classrooms.get(0);

        timetableEntryRepository.saveAll(List.of(
                slot(firstClassroom, DayOfWeek.MON, "09:00", "10:30",
                        "Data Structures & Algorithms", "CS-301", TimetableEntry.SlotType.LECTURE,
                        101L, "Dr. Sarah Müller", "Hall C (Capacity: 120)"),
                slot(firstClassroom, DayOfWeek.MON, "11:30", "13:00",
                        "Advanced Machine Learning", "CS-405", TimetableEntry.SlotType.LAB,
                        102L, "Prof. J. Albers", "Lab 4 (Requires Setup)"),
                slot(firstClassroom, DayOfWeek.MON, "14:00", "15:30",
                        "Curriculum Review Meeting", "DEPT", TimetableEntry.SlotType.TUTORIAL,
                        103L, "Admin Committee", "Admin Block, Room 201"),
                slot(firstClassroom, DayOfWeek.TUE, "08:00", "09:30",
                        "Color Theory & UI Synthesis", "DS-201", TimetableEntry.SlotType.LAB,
                        104L, "Prof. P. Klee", "Studio 2"),
                slot(firstClassroom, DayOfWeek.TUE, "10:00", "11:30",
                        "Operating Systems & Concurrency", "OS-301", TimetableEntry.SlotType.LECTURE,
                        101L, "Dr. Sarah Müller", "Room 201"),
                slot(firstClassroom, DayOfWeek.WED, "08:00", "09:30",
                        "Design Systems & Bauhaus Form", "DES-402", TimetableEntry.SlotType.LECTURE,
                        102L, "Prof. J. Albers", "Rm 402"),
                slot(firstClassroom, DayOfWeek.THU, "10:00", "11:30",
                        "Advanced Typography & Grid Layouts", "TYP-302", TimetableEntry.SlotType.LECTURE,
                        102L, "Prof. J. Albers", "Rm 301"),
                slot(firstClassroom, DayOfWeek.FRI, "08:00", "09:30",
                        "Material Studies & Architectural Form", "MAT-101", TimetableEntry.SlotType.SEMINAR,
                        101L, "Dr. Sarah Müller", "Lab A"),
                slot(firstClassroom, DayOfWeek.FRI, "14:00", "15:30",
                        "Database Management Systems", "DBMS-402", TimetableEntry.SlotType.LECTURE,
                        105L, "Dr. K. Chen", "Hall B")
        ));

        announcementRepository.saveAll(List.of(
                announcement(null, "CSE", "Mandatory Server Maintenance & System Downtime Scheduled for Weekend",
                        "Please be advised that the main university servers will undergo critical infrastructure upgrades this coming weekend. Access to the Learning Management System, Student Portal, and faculty email servers will be intermittent from Saturday 10:00 PM to Sunday 06:00 AM. Ensure all grades and crucial documents are saved locally before this window.",
                        Announcement.AnnouncementType.DEPARTMENT, "Admin IT Support",
                        "Infrastructure Team", true),
                announcement(firstClassroom, "CSE", "Updated Reading List for Module 4: Advanced Data Structures",
                        "I have uploaded a revised syllabus for Module 4 to the resources folder. We will be skipping chapter 7 in the primary textbook and instead focusing on the newly attached PDF regarding non-linear graph traversal algorithms. Please review this material before Thursday's lecture.",
                        Announcement.AnnouncementType.SECTION, "Dr. Sarah Müller",
                        "Course Instructor", false),
                announcement(null, "GENERAL", "Annual Design Thinking Symposium Registration Now Open",
                        "Join us for the 5th Annual Bauhaus Design Thinking Symposium. This year's theme focuses on integrating geometric functionalism with modern digital interfaces. Guest speakers include industry leaders from top tech firms. Early bird registration ends next Friday.",
                        Announcement.AnnouncementType.GENERAL, "Events Committee",
                        "Campus Life", false),
                announcement(null, "CSE", "Revised Academic Calendar Published for Fall Semester",
                        "Please note the changes in the mid-semester break dates as per the new university directive. Mid-term examination blocks are moved forward by three academic working days.",
                        Announcement.AnnouncementType.DEPARTMENT, "HOD Office",
                        "Department Head", false),
                announcement(null, "GENERAL", "New IEEE Journal & Digital Library Access Active",
                        "Faculty members and students can now access the expanded IEEE Xplore digital library using their campus single sign-on credentials.",
                        Announcement.AnnouncementType.GENERAL, "Library Services",
                        "Academic Resource Desk", false)
        ));

        resourceRepository.saveAll(createResources(firstClassroom));
        academicEventRepository.saveAll(createEvents(firstClassroom));

        log.info("Seeded demo data: 5 classrooms, 9 timetable slots, 5 announcements, 5 resources, and 6 events.");
    }

    private boolean hasExistingData() {
        return classroomRepository.count() > 0
                || timetableEntryRepository.count() > 0
                || announcementRepository.count() > 0
                || resourceRepository.count() > 0
                || academicEventRepository.count() > 0;
    }

    private static Classroom classroom(
            String name, String section, String department, int year, int semester,
            int capacity, int studentCount, String academicYear, String advisorName,
            String advisorEmail, String classroomNumber, int syllabusProgress,
            int totalLecturesToday, int pendingGrading) {
        return Classroom.builder()
                .name(name)
                .section(section)
                .department(department)
                .year(year)
                .semester(semester)
                .capacity(capacity)
                .studentCount(studentCount)
                .academicYear(academicYear)
                .advisorName(advisorName)
                .advisorEmail(advisorEmail)
                .classroomNumber(classroomNumber)
                .syllabusProgress(syllabusProgress)
                .totalLecturesToday(totalLecturesToday)
                .pendingGrading(pendingGrading)
                .build();
    }

    private static TimetableEntry slot(
            Classroom classroom, DayOfWeek day, String startTime, String endTime,
            String subject, String subjectCode, TimetableEntry.SlotType type,
            long facultyId, String facultyName, String roomNumber) {
        return TimetableEntry.builder()
                .classroom(classroom)
                .day(day)
                .startTime(LocalTime.parse(startTime))
                .endTime(LocalTime.parse(endTime))
                .subject(subject)
                .subjectCode(subjectCode)
                .type(type)
                .facultyId(facultyId)
                .facultyName(facultyName)
                .roomNumber(roomNumber)
                .build();
    }

    private static Announcement announcement(
            Classroom classroom, String department, String title, String body,
            Announcement.AnnouncementType type, String createdByName, String authorRole,
            boolean urgent) {
        return Announcement.builder()
                .classroom(classroom)
                .department(department)
                .title(title)
                .body(body)
                .type(type)
                .createdBy(1L)
                .createdByName(createdByName)
                .authorRole(authorRole)
                .urgent(urgent)
                .build();
    }

    private List<Resource> createResources(Classroom classroom) throws IOException {
        List<ResourceSeed> seeds = List.of(
                new ResourceSeed("Process Synchronization & Deadlocks",
                        "Detailed notes covering Mutexes, Semaphores, Monitors, and Banker's Algorithm with code examples.",
                        "OS-301", Resource.ResourceType.NOTES, 101L, "Dr. Sarah Müller"),
                new ResourceSeed("Normal Forms and Dependency Preservation",
                        "Lecture slides for week 5 covering 1NF through BCNF, closure properties, and lossless decomposition algorithms.",
                        "DBMS-402", Resource.ResourceType.PPT, 105L, "Dr. K. Chen"),
                new ResourceSeed("Implementation of K-Means Clustering",
                        "Problem set 3: Build K-Means from scratch in Python and analyze convergence rates on high-dimensional datasets.",
                        "ML-505", Resource.ResourceType.ASSIGNMENT, 102L, "Prof. J. Albers"),
                new ResourceSeed("TCP Congestion Control Mechanisms",
                        "Video recording of lecture 12. Covers Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery algorithms.",
                        "CN-401", Resource.ResourceType.RECORDED_LECTURE, 101L, "Dr. Sarah Müller"),
                new ResourceSeed("Operating Systems: Three Easy Pieces (Reference Edition)",
                        "Supplemental reference readings for virtual memory, page replacement algorithms, and multi-level page tables.",
                        "OS-301", Resource.ResourceType.REFERENCE, 101L, "Dr. Sarah Müller")
        );
        Path demoDirectory = Paths.get(fileStorageConfig.getUploadDir())
                .toAbsolutePath()
                .normalize()
                .resolve("demo");
        Files.createDirectories(demoDirectory);

        java.util.ArrayList<Resource> resources = new java.util.ArrayList<>();
        for (int index = 0; index < seeds.size(); index++) {
            ResourceSeed seed = seeds.get(index);
            String fileName = "demo-resource-" + (index + 1) + ".txt";
            Path filePath = demoDirectory.resolve(fileName);
            byte[] contents = ("Demo placeholder for: " + seed.title() + System.lineSeparator()
                    + seed.description() + System.lineSeparator()).getBytes(StandardCharsets.UTF_8);
            Files.write(filePath, contents, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            resources.add(Resource.builder()
                    .classroom(classroom)
                    .title(seed.title())
                    .description(seed.description())
                    .subject(seed.subject())
                    .type(seed.type())
                    .fileUrl(filePath.toString())
                    .fileName(fileName)
                    .fileSizeBytes((long) contents.length)
                    .uploadedBy(seed.uploadedBy())
                    .uploadedByName(seed.uploadedByName())
                    .build());
        }
        return resources;
    }

    private static List<AcademicEvent> createEvents(Classroom classroom) {
        List<EventSeed> seeds = List.of(
                new EventSeed("Midterm Examination: Quantum Mechanics & Computation",
                        "Covers Units 1 through 3. Closed-book written examination with scientific calculator permitted.",
                        AcademicEvent.EventType.TEST, "PHY-301 - Advanced Physics",
                        "14:00", 120, "Hall B", true, 101L, "Dr. Sarah Müller"),
                new EventSeed("Research Methodology Proposal Submission",
                        "Upload PDF proposal with literature review and experimental design schema.",
                        AcademicEvent.EventType.ASSIGNMENT, "RES-500 - Graduate Seminar",
                        "23:59", 0, "Online Submission Portal", true, 101L, "Dr. Sarah Müller"),
                new EventSeed("AI Ethics & Algorithmic Fairness Group Defense",
                        "Group presentation evaluating bias mitigation in large-scale classification pipelines.",
                        AcademicEvent.EventType.PRESENTATION, "CS-405 - Machine Learning",
                        "09:00", 45, "Seminar Rm 3", false, 101L, "Dr. Sarah Müller"),
                new EventSeed("Literature & Critical Theory Oral Exam",
                        "Individual 30-minute viva covering modern aesthetics and architectural prose.",
                        AcademicEvent.EventType.VIVA, "ENG-201 - Humanities",
                        "11:30", 30, "Virtual Link / Studio 2", false, 101L, "Dr. Sarah Müller"),
                new EventSeed("Faculty Guest Lecture: Dr. Chen on High-Performance DBs",
                        "Department-wide technical keynote on distributed consensus in LSM-tree architectures.",
                        AcademicEvent.EventType.OTHER, "Dept. Wide Keynote",
                        "15:00", 90, "Main Auditorium", false, 101L, "Dr. Sarah Müller"),
                new EventSeed("Final Year Project Phase 1 Demonstrations",
                        "Evaluation committee walkthrough for semester milestones.",
                        AcademicEvent.EventType.PRESENTATION, "CS-490 - Capstone",
                        "10:00", 180, "Panel 3 - Main Auditorium", false, 101L, "Dr. Sarah Müller")
        );
        LocalDate today = LocalDate.now();

        return java.util.stream.IntStream.range(0, seeds.size())
                .mapToObj(index -> {
                    EventSeed seed = seeds.get(index);
                    return AcademicEvent.builder()
                            .classroom(classroom)
                            .title(seed.title())
                            .description(seed.description())
                            .type(seed.type())
                            .subject(seed.subject())
                            .eventDateTime(today.plusDays(index + 1L).atTime(LocalTime.parse(seed.time())))
                            .durationMinutes(seed.durationMinutes())
                            .venue(seed.venue())
                            .syncedToCalendar(false)
                            .isUrgent(seed.urgent())
                            .createdBy(seed.createdBy())
                            .createdByName(seed.createdByName())
                            .build();
                })
                .toList();
    }

    private record ResourceSeed(
            String title, String description, String subject, Resource.ResourceType type,
            Long uploadedBy, String uploadedByName) {
    }

    private record EventSeed(
            String title, String description, AcademicEvent.EventType type, String subject,
            String time, int durationMinutes, String venue, boolean urgent,
            Long createdBy, String createdByName) {
    }
}
