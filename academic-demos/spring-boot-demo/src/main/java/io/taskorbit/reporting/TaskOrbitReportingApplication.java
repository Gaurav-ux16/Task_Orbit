package io.taskorbit.reporting;

import io.taskorbit.reporting.entity.ProjectReportEntity;
import io.taskorbit.reporting.entity.TaskSummaryEntity;
import io.taskorbit.reporting.repository.ProjectReportRepository;
import io.taskorbit.reporting.repository.TaskSummaryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;
import java.util.Arrays;

/**
 * TaskOrbitReportingApplication — Spring Boot Application Entry Point.
 * 
 * Demonstrates Syllabus Concepts:
 * 1. "Spring Framework and Spring Boot"
 * 2. "Core features" (Bootstrapping, Dependency Injection, Auto-configuration)
 * 3. "Installation and project setup"
 */
@SpringBootApplication
public class TaskOrbitReportingApplication {

    private static final Logger log = LoggerFactory.getLogger(TaskOrbitReportingApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(TaskOrbitReportingApplication.class, args);
        log.info("[TaskOrbit Spring Boot Demo] 🚀 Academic Reporting Service started on port 8081.");
        log.info("[TaskOrbit Spring Boot Demo] Actuator Health: http://localhost:8081/actuator/health");
        log.info("[TaskOrbit Spring Boot Demo] Public Report: http://localhost:8081/api/reports/public");
    }

    /**
     * Seeds initial academic reporting fixtures into the H2 database on startup.
     */
    @Bean
    public CommandLineRunner seedDemoData(ProjectReportRepository projectRepo,
                                          TaskSummaryRepository taskRepo) {
        return args -> {
            log.info("[Spring Boot] Pre-seeding H2 in-memory reporting database...");

            ProjectReportEntity p1 = new ProjectReportEntity(
                    "22222222-0000-0000-0000-000000000001",
                    "E-Commerce Platform Redesign",
                    "Full-stack storefront redesign with React and Express API",
                    "Alice Chen (Client)",
                    "Bob Martinez (Project Manager)",
                    "active",
                    LocalDate.of(2026, 10, 1),
                    LocalDate.of(2026, 12, 31),
                    4, 1, 1, 2
            );
            projectRepo.save(p1);

            TaskSummaryEntity t1 = new TaskSummaryEntity(
                    "33333333-0000-0000-0000-000000000001",
                    p1.getId(),
                    "Design new checkout flow",
                    "assignee-001",
                    "Carol Singh (Developer)",
                    "approved",
                    "high",
                    LocalDate.of(2026, 10, 1),
                    LocalDate.of(2026, 10, 15),
                    false
            );

            TaskSummaryEntity t2 = new TaskSummaryEntity(
                    "33333333-0000-0000-0000-000000000002",
                    p1.getId(),
                    "Implement product listing page",
                    "assignee-001",
                    "Carol Singh (Developer)",
                    "in_review",
                    "high",
                    LocalDate.of(2026, 10, 10),
                    LocalDate.of(2026, 10, 25),
                    false
            );

            TaskSummaryEntity t3 = new TaskSummaryEntity(
                    "33333333-0000-0000-0000-000000000003",
                    p1.getId(),
                    "Payment gateway integration",
                    "assignee-001",
                    "Carol Singh (Developer)",
                    "in_progress",
                    "critical",
                    LocalDate.of(2026, 10, 20),
                    LocalDate.of(2026, 11, 10),
                    true // Conflict override demonstration
            );

            taskRepo.saveAll(Arrays.asList(t1, t2, t3));
            log.info("[Spring Boot] H2 database initialized with 1 project and 3 task summaries.");
        };
    }
}
