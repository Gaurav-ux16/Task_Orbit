package io.taskorbit.demo.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * WorkerBean — JavaBean representing an Assignee/Worker in the academic demo.
 * 
 * Complies with the JavaBean specification:
 * 1. Implements java.io.Serializable
 * 2. Public zero-argument constructor
 * 3. Private properties with standard getter and setter methods
 */
public class WorkerBean implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String displayName;
    private String role;
    private String availability;
    private String email;
    private List<String> skills = new ArrayList<>();
    private int activeTaskCount;

    public WorkerBean() {
    }

    public WorkerBean(String id, String displayName, String role, String availability,
                      String email, List<String> skills, int activeTaskCount) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.availability = availability;
        this.email = email;
        this.skills = skills != null ? skills : new ArrayList<>();
        this.activeTaskCount = activeTaskCount;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public int getActiveTaskCount() {
        return activeTaskCount;
    }

    public void setActiveTaskCount(int activeTaskCount) {
        this.activeTaskCount = activeTaskCount;
    }
}
