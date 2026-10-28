package io.taskorbit.reporting;

import io.taskorbit.reporting.dto.ProjectReportDTO;
import io.taskorbit.reporting.entity.ProjectReportEntity;
import io.taskorbit.reporting.repository.ProjectReportRepository;
import io.taskorbit.reporting.repository.TaskSummaryRepository;
import io.taskorbit.reporting.service.ReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * ReportServiceTest — Unit testing demonstration for Spring Boot service.
 * 
 * Demonstrates Syllabus Concept:
 * - "Testing" (JUnit 5 + Mockito unit tests for Spring services)
 */
@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private ProjectReportRepository projectRepository;

    @Mock
    private TaskSummaryRepository taskRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(projectRepository, taskRepository, eventPublisher);
    }

    @Test
    void testGetProjectReportsCalculatesProgressCorrectly() {
        ProjectReportEntity mockProject = new ProjectReportEntity(
                "p-1", "Test Project", "Description", "Client A", "Manager B",
                "active", LocalDate.now(), LocalDate.now().plusMonths(2),
                10, 5, 2, 3
        );

        when(projectRepository.findAll()).thenReturn(Collections.singletonList(mockProject));

        List<ProjectReportDTO> reports = reportService.getProjectReports("test-manager");

        assertNotNull(reports);
        assertEquals(1, reports.size());
        assertEquals("p-1", reports.get(0).getProjectId());
        assertEquals(50, reports.get(0).getProgressPercentage()); // 5 / 10 = 50%

        // Verify audit event was published
        verify(eventPublisher, times(1)).publishEvent(any());
    }
}
