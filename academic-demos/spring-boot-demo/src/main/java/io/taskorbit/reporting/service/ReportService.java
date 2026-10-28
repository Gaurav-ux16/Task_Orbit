package io.taskorbit.reporting.service;

import io.taskorbit.reporting.dto.ConflictSummaryDTO;
import io.taskorbit.reporting.dto.ProjectReportDTO;
import io.taskorbit.reporting.dto.WorkerWorkloadDTO;
import io.taskorbit.reporting.entity.ProjectReportEntity;
import io.taskorbit.reporting.entity.TaskSummaryEntity;
import io.taskorbit.reporting.event.ReportRequestedEvent;
import io.taskorbit.reporting.repository.ProjectReportRepository;
import io.taskorbit.reporting.repository.TaskSummaryRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * ReportService — Core business logic service with Dependency Injection.
 * 
 * Demonstrates Syllabus Concepts:
 * - "Core features" (Service beans, Dependency Injection via constructor)
 * - "JPA database connectivity" (Calling Spring Data JPA repositories)
 * - "Messaging" (Publishing ApplicationEvents)
 */
@Service
public class ReportService {

    private final ProjectReportRepository projectRepository;
    private final TaskSummaryRepository taskRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ReportService(ProjectReportRepository projectRepository,
                         TaskSummaryRepository taskRepository,
                         ApplicationEventPublisher eventPublisher) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.eventPublisher = eventPublisher;
    }

    public List<ProjectReportDTO> getProjectReports(String requestedBy) {
        // Publish audit event via Spring messaging
        eventPublisher.publishEvent(new ReportRequestedEvent(this, "PROJECT_PROGRESS_REPORT", requestedBy));

        List<ProjectReportEntity> entities = projectRepository.findAll();
        return entities.stream().map(e -> {
            int pct = e.getTotalTasks() > 0 ? (int) Math.round(((double) e.getCompletedTasks() / e.getTotalTasks()) * 100) : 0;
            return new ProjectReportDTO(
                    e.getId(),
                    e.getTitle(),
                    e.getClientName(),
                    e.getManagerName(),
                    e.getStatus(),
                    e.getStartDate(),
                    e.getDueDate(),
                    e.getTotalTasks(),
                    e.getCompletedTasks(),
                    pct
            );
        }).collect(Collectors.toList());
    }

    public List<WorkerWorkloadDTO> getWorkerWorkloadSummary(String requestedBy) {
        eventPublisher.publishEvent(new ReportRequestedEvent(this, "WORKER_WORKLOAD_REPORT", requestedBy));

        List<TaskSummaryEntity> allTasks = taskRepository.findAll();
        Map<String, List<TaskSummaryEntity>> byAssignee = allTasks.stream()
                .filter(t -> t.getAssigneeId() != null)
                .collect(Collectors.groupingBy(TaskSummaryEntity::getAssigneeId));

        List<WorkerWorkloadDTO> result = new ArrayList<>();
        byAssignee.forEach((assigneeId, tasks) -> {
            String name = tasks.get(0).getAssigneeName();
            int active = (int) tasks.stream().filter(t -> Arrays.asList("todo", "in_progress").contains(t.getStatus())).count();
            int inReview = (int) tasks.stream().filter(t -> "in_review".equals(t.getStatus())).count();
            int approved = (int) tasks.stream().filter(t -> "approved".equals(t.getStatus())).count();
            boolean conflicts = tasks.stream().anyMatch(TaskSummaryEntity::isHasConflictOverride);

            result.add(new WorkerWorkloadDTO(assigneeId, name, tasks.size(), active, inReview, approved, conflicts));
        });

        return result;
    }

    public List<ConflictSummaryDTO> getConflictSummary(String requestedBy) {
        eventPublisher.publishEvent(new ReportRequestedEvent(this, "CONFLICT_SUMMARY_REPORT", requestedBy));

        List<TaskSummaryEntity> conflictTasks = taskRepository.findByHasConflictOverrideTrue();
        return conflictTasks.stream().map(t -> new ConflictSummaryDTO(
                t.getId(),
                t.getTitle(),
                t.getAssigneeName(),
                t.getStartDate(),
                t.getDueDate(),
                t.isHasConflictOverride()
        )).collect(Collectors.toList());
    }

    public Map<String, Object> getPublicExecutiveSummary() {
        long totalProjects = projectRepository.count();
        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus("approved");

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("service", "TaskOrbit Reporting Service (Spring Boot 3)");
        summary.put("status", "ONLINE");
        summary.put("total_projects_tracked", totalProjects);
        summary.put("total_tasks_tracked", totalTasks);
        summary.put("total_approved_deliverables", completedTasks);
        summary.put("auth_note", "Full reports require HTTP Basic Auth with role PROJECT_MANAGER");
        return summary;
    }
}
