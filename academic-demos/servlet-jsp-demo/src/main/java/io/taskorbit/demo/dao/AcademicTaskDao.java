package io.taskorbit.demo.dao;

import io.taskorbit.demo.model.TaskBean;
import io.taskorbit.demo.model.WorkerBean;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AcademicTaskDao — Data Access Object demonstrating MySQL JDBC connectivity
 * with prepared statements, alongside an in-memory fallback store.
 * 
 * Demonstrates Syllabus Concept: "MySQL with Java Servlets" & "Data Storage".
 */
public class AcademicTaskDao {

    private static final String DEFAULT_JDBC_URL = "jdbc:mysql://localhost:3306/taskorbit_servlet_demo?useSSL=false&allowPublicKeyRetrieval=true";
    private static final String DEFAULT_DB_USER = "root";
    private static final String DEFAULT_DB_PASS = "";

    // In-memory demo fixture store for execution when MySQL is offline
    private static final ConcurrentHashMap<String, TaskBean> IN_MEMORY_TASKS = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, WorkerBean> IN_MEMORY_WORKERS = new ConcurrentHashMap<>();

    static {
        // Seed mock workers
        WorkerBean carol = new WorkerBean("assignee-001", "Carol Singh (Developer)", "assignee",
                "available", "carol@taskorbit.io", Arrays.asList("React", "TypeScript", "Node.js"), 2);
        WorkerBean dave = new WorkerBean("assignee-002", "Dave Kim (Developer)", "assignee",
                "busy", "dave@taskorbit.io", Arrays.asList("Express.js", "PostgreSQL", "Docker"), 1);
        IN_MEMORY_WORKERS.put(carol.getId(), carol);
        IN_MEMORY_WORKERS.put(dave.getId(), dave);

        // Seed mock tasks
        TaskBean t1 = new TaskBean("task-101", "Design Checkout Flow", "Refactor UI components for checkout.",
                "assignee-001", "Carol Singh", "in_progress", "high", "2026-10-15", "2026-10-25", 1);
        TaskBean t2 = new TaskBean("task-102", "Build Product Listing", "Catalogue with search and pagination.",
                "assignee-001", "Carol Singh", "submitted", "medium", "2026-10-20", "2026-11-05", 2);
        TaskBean t3 = new TaskBean("task-103", "Payment Gateway Integration", "Stripe API webhook integration.",
                "assignee-002", "Dave Kim", "todo", "critical", "2026-11-01", "2026-11-15", 0);

        IN_MEMORY_TASKS.put(t1.getId(), t1);
        IN_MEMORY_TASKS.put(t2.getId(), t2);
        IN_MEMORY_TASKS.put(t3.getId(), t3);
    }

    /**
     * Attempts MySQL JDBC query via PreparedStatement.
     * Falls back to in-memory store if MySQL connection fails.
     */
    public List<TaskBean> getTasksByWorkerId(String workerId) {
        List<TaskBean> result = new ArrayList<>();
        String sql = "SELECT id, title, description, assignee_id, assignee_name, status, priority, start_date, due_date, version_number FROM demo_tasks WHERE assignee_id = ?";

        try (Connection conn = DriverManager.getConnection(DEFAULT_JDBC_URL, DEFAULT_DB_USER, DEFAULT_DB_PASS);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, workerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TaskBean task = new TaskBean(
                            rs.getString("id"),
                            rs.getString("title"),
                            rs.getString("description"),
                            rs.getString("assignee_id"),
                            rs.getString("assignee_name"),
                            rs.getString("status"),
                            rs.getString("priority"),
                            rs.getString("start_date"),
                            rs.getString("due_date"),
                            rs.getInt("version_number")
                    );
                    result.add(task);
                }
            }
            return result;
        } catch (SQLException e) {
            // Educational Fallback: MySQL unavailable -> use in-memory store
            for (TaskBean t : IN_MEMORY_TASKS.values()) {
                if (workerId == null || workerId.isEmpty() || t.getAssigneeId().equals(workerId)) {
                    result.add(t);
                }
            }
            return result;
        }
    }

    public TaskBean getTaskById(String taskId) {
        String sql = "SELECT id, title, description, assignee_id, assignee_name, status, priority, start_date, due_date, version_number FROM demo_tasks WHERE id = ?";

        try (Connection conn = DriverManager.getConnection(DEFAULT_JDBC_URL, DEFAULT_DB_USER, DEFAULT_DB_PASS);
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, taskId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new TaskBean(
                            rs.getString("id"),
                            rs.getString("title"),
                            rs.getString("description"),
                            rs.getString("assignee_id"),
                            rs.getString("assignee_name"),
                            rs.getString("status"),
                            rs.getString("priority"),
                            rs.getString("start_date"),
                            rs.getString("due_date"),
                            rs.getInt("version_number")
                    );
                }
            }
        } catch (SQLException e) {
            // Fallback to in-memory store
            return IN_MEMORY_TASKS.get(taskId);
        }
        return IN_MEMORY_TASKS.get(taskId);
    }

    public List<WorkerBean> getAllWorkers() {
        return new ArrayList<>(IN_MEMORY_WORKERS.values());
    }

    public WorkerBean getWorkerById(String id) {
        return IN_MEMORY_WORKERS.get(id);
    }
}
