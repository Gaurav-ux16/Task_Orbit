package io.taskorbit.reporting.dto;

import java.time.LocalDate;

/**
 * ConflictSummaryDTO — Reporting summary of scheduling conflicts and overrides.
 */
public class ConflictSummaryDTO {

    private String taskId;
    private String taskTitle;
    private String assigneeName;
    private LocalDate startDate;
    private LocalDate dueDate;
    private boolean conflictOverridden;

    public ConflictSummaryDTO() {
    }

    public ConflictSummaryDTO(String taskId, String taskTitle, String assigneeName,
                              LocalDate startDate, LocalDate dueDate, boolean conflictOverridden) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.assigneeName = assigneeName;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.conflictOverridden = conflictOverridden;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getAssigneeName() {
        return assigneeName;
    }

    public void setAssigneeName(String assigneeName) {
        this.assigneeName = assigneeName;
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

    public boolean isConflictOverridden() {
        return conflictOverridden;
    }

    public void setConflictOverridden(boolean conflictOverridden) {
        this.conflictOverridden = conflictOverridden;
    }
}
