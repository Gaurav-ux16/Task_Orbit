package io.taskorbit.reporting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * ProjectReportEntity — JPA Entity representing project reporting summary.
 * 
 * Demonstrates Syllabus Concept:
 * - "JPA database connectivity" (@Entity, @Table, @Id, @Column)
 */
@Entity
@Table(name = "demo_project_reports")
public class ProjectReportEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    private String clientName;
    private String managerName;
    private String status;
    private LocalDate startDate;
    private LocalDate dueDate;

    private int totalTasks;
    private int completedTasks;
    private int inReviewTasks;
    private int activeTasks;

    public ProjectReportEntity() {
    }

    public ProjectReportEntity(String id, String title, String description, String clientName,
                               String managerName, String status, LocalDate startDate,
                               LocalDate dueDate, int totalTasks, int completedTasks,
                               int inReviewTasks, int activeTasks) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.clientName = clientName;
        this.managerName = managerName;
        this.status = status;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.inReviewTasks = inReviewTasks;
        this.activeTasks = activeTasks;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
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

    public int getInReviewTasks() {
        return inReviewTasks;
    }

    public void setInReviewTasks(int inReviewTasks) {
        this.inReviewTasks = inReviewTasks;
    }

    public int getActiveTasks() {
        return activeTasks;
    }

    public void setActiveTasks(int activeTasks) {
        this.activeTasks = activeTasks;
    }
}
