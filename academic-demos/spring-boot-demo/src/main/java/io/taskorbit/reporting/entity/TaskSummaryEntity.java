package io.taskorbit.reporting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * TaskSummaryEntity — JPA Entity representing individual task summary records.
 */
@Entity
@Table(name = "demo_task_summaries")
public class TaskSummaryEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(nullable = false, length = 64)
    private String projectId;

    @Column(nullable = false)
    private String title;

    private String assigneeId;
    private String assigneeName;
    private String status;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private boolean hasConflictOverride;

    public TaskSummaryEntity() {
    }

    public TaskSummaryEntity(String id, String projectId, String title, String assigneeId,
                             String assigneeName, String status, String priority,
                             LocalDate startDate, LocalDate dueDate, boolean hasConflictOverride) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.status = status;
        this.priority = priority;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.hasConflictOverride = hasConflictOverride;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(String assigneeId) {
        this.assigneeId = assigneeId;
    }

    public String getAssigneeName() {
        return assigneeName;
    }

    public void setAssigneeName(String assigneeName) {
        this.assigneeName = assigneeName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isHasConflictOverride() {
        return hasConflictOverride;
    }

    public void setHasConflictOverride(boolean hasConflictOverride) {
        this.hasConflictOverride = hasConflictOverride;
    }
}
