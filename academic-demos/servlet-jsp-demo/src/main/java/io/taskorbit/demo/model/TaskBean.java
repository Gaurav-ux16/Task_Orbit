package io.taskorbit.demo.model;

import java.io.Serializable;

/**
 * TaskBean — JavaBean representing a TaskOrbit Task entity.
 * 
 * Complies with the JavaBean specification:
 * 1. Implements java.io.Serializable
 * 2. Public zero-argument constructor
 * 3. Private properties with standard getter and setter methods
 */
public class TaskBean implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String description;
    private String assigneeId;
    private String assigneeName;
    private String status;
    private String priority;
    private String startDate;
    private String dueDate;
    private int latestVersionNumber;

    // Public zero-argument constructor
    public TaskBean() {
    }

    // Convenience constructor
    public TaskBean(String id, String title, String description, String assigneeId,
                    String assigneeName, String status, String priority,
                    String startDate, String dueDate, int latestVersionNumber) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.status = status;
        this.priority = priority;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.latestVersionNumber = latestVersionNumber;
    }

    // Standard Getters and Setters
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

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public int getLatestVersionNumber() {
        return latestVersionNumber;
    }

    public void setLatestVersionNumber(int latestVersionNumber) {
        this.latestVersionNumber = latestVersionNumber;
    }
}
