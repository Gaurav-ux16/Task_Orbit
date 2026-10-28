package io.taskorbit.reporting.dto;

import java.time.LocalDate;

/**
 * ProjectReportDTO — Data Transfer Object for project progress reports.
 */
public class ProjectReportDTO {

    private String projectId;
    private String title;
    private String client;
    private String manager;
    private String status;
    private LocalDate startDate;
    private LocalDate dueDate;
    private int totalTasks;
    private int completedTasks;
    private int progressPercentage;

    public ProjectReportDTO() {
    }

    public ProjectReportDTO(String projectId, String title, String client, String manager,
                            String status, LocalDate startDate, LocalDate dueDate,
                            int totalTasks, int completedTasks, int progressPercentage) {
        this.projectId = projectId;
        this.title = title;
        this.client = client;
        this.manager = manager;
        this.status = status;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.progressPercentage = progressPercentage;
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

    public String getClient() {
        return client;
    }

    public void setClient(String client) {
        this.client = client;
    }

    public String getManager() {
        return manager;
    }

    public void setManager(String manager) {
        this.manager = manager;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public int getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(int totalTasks) {
        this.totalTasks = totalTasks;
    }

    public int getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(int completedTasks) {
        this.completedTasks = completedTasks;
    }

    public int getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(int progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}
