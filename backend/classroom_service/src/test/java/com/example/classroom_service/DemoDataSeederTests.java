package com.example.classroom_service;

import com.example.classroom_service.config.DemoDataSeeder;
import com.example.classroom_service.model.TimetableEntry;
import com.example.classroom_service.repository.AcademicEventRepository;
import com.example.classroom_service.repository.AnnouncementRepository;
import com.example.classroom_service.repository.ClassroomRepository;
import com.example.classroom_service.repository.ResourceRepository;
import com.example.classroom_service.repository.TimetableEntryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("demo")
class DemoDataSeederTests {

    @Autowired
    private DemoDataSeeder demoDataSeeder;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private TimetableEntryRepository timetableEntryRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Test
    void seedsAllFrontendDemoDatasetsAndIsIdempotent() throws Exception {
        assertEquals(5, classroomRepository.count());
        assertEquals("AIML", classroomRepository.findByDepartment("AIML").get(0).getDepartment());
        assertEquals(9, timetableEntryRepository.count());
        assertEquals(TimetableEntry.SlotType.TUTORIAL, timetableEntryRepository.findAll().stream()
                .filter(entry -> "Curriculum Review Meeting".equals(entry.getSubject()))
                .findFirst()
                .orElseThrow()
                .getType());
        assertEquals(5, announcementRepository.count());
        assertEquals(5, resourceRepository.count());
        assertEquals(6, academicEventRepository.count());

        demoDataSeeder.run();

        assertEquals(5, classroomRepository.count());
        assertEquals(9, timetableEntryRepository.count());
        assertEquals(5, announcementRepository.count());
        assertEquals(5, resourceRepository.count());
        assertEquals(6, academicEventRepository.count());
    }
}
