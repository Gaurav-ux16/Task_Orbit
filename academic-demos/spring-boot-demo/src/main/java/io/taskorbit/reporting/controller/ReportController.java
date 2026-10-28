package io.taskorbit.reporting.controller;

import io.taskorbit.reporting.dto.ConflictSummaryDTO;
import io.taskorbit.reporting.dto.ProjectReportDTO;
import io.taskorbit.reporting.dto.WorkerWorkloadDTO;
import io.taskorbit.reporting.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * ReportController — Spring Boot REST Controller.
 * 
 * Demonstrates Syllabus Concepts:
 * - "Web applications" (@RestController, @GetMapping, ResponseEntity)
 * - "Spring Security" (Principal extraction, endpoint protection)
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Public endpoint accessible without authentication.
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> getPublicOverview() {
        return ResponseEntity.ok(reportService.getPublicExecutiveSummary());
    }

    /**
     * Secured endpoint: Returns detailed project progress reports.
     */
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectReportDTO>> getProjectReports(Authentication auth) {
        String user = auth != null ? auth.getName() : "anonymous";
        return ResponseEntity.ok(reportService.getProjectReports(user));
    }

    /**
     * Secured endpoint: Returns aggregated developer workload summaries.
     */
    @GetMapping("/workers")
    public ResponseEntity<List<WorkerWorkloadDTO>> getWorkerWorkloads(Authentication auth) {
        String user = auth != null ? auth.getName() : "anonymous";
        return ResponseEntity.ok(reportService.getWorkerWorkloadSummary(user));
    }

    /**
     * Secured endpoint: Returns audit list of scheduling conflicts & overrides.
     */
    @GetMapping("/conflicts")
    public ResponseEntity<List<ConflictSummaryDTO>> getConflicts(Authentication auth) {
        String user = auth != null ? auth.getName() : "anonymous";
        return ResponseEntity.ok(reportService.getConflictSummary(user));
    }
}
