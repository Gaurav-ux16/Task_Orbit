-- ============================================================================
-- Unit IV Academic Demonstration: MySQL Reporting Database Schema
-- TaskOrbit Project & Workload Read-Only Reporting Service
-- ============================================================================
-- Database: taskorbit_academic_reporting
-- Purpose: Isolated academic reporting database schema for Spring Boot JPA entity demonstration.
-- Isolation Notice: This schema is strictly educational and isolated from the live Supabase/PostgreSQL database.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS taskorbit_academic_reporting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskorbit_academic_reporting;

-- Table: academic_project_reports
DROP TABLE IF EXISTS academic_task_summaries;
DROP TABLE IF EXISTS academic_project_reports;

CREATE TABLE academic_project_reports (
    id VARCHAR(64) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_tasks INT NOT NULL DEFAULT 0,
    completed_tasks INT NOT NULL DEFAULT 0,
    completion_percentage DOUBLE NOT NULL DEFAULT 0.0,
    generated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: academic_task_summaries
CREATE TABLE academic_task_summaries (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    assignee_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    due_date VARCHAR(50) NOT NULL,
    has_conflict_override TINYINT(1) NOT NULL DEFAULT 0,
    conflict_task_ids VARCHAR(500) NULL,
    CONSTRAINT fk_summary_project FOREIGN KEY (project_id)
        REFERENCES academic_project_reports(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial demonstration snapshot data
INSERT INTO academic_project_reports (id, project_name, client_name, manager_name, status, total_tasks, completed_tasks, completion_percentage, generated_at)
VALUES 
('proj-rep-001', 'TaskOrbit Platform Core', 'Acme Corp', 'Gaurav Kumar', 'active', 5, 2, 40.0, NOW()),
('proj-rep-002', 'Cloud Infrastructure Migration', 'Global Systems', 'Gaurav Kumar', 'planning', 2, 0, 0.0, NOW());

INSERT INTO academic_task_summaries (id, project_id, title, assignee_name, status, priority, start_date, due_date, has_conflict_override, conflict_task_ids)
VALUES
('sum-task-001', 'proj-rep-001', 'Database Schema & State Machine', 'Alice Smith', 'approved', 'high', '2026-10-15', '2026-10-22', 0, NULL),
('sum-task-002', 'proj-rep-001', 'Reviewer Queue & Stale Check', 'Alice Smith', 'in_progress', 'high', '2026-10-20', '2026-10-27', 1, 'sum-task-003'),
('sum-task-003', 'proj-rep-001', 'Inclusive Conflict Preview Engine', 'Alice Smith', 'todo', 'medium', '2026-10-25', '2026-11-01', 1, 'sum-task-002'),
('sum-task-004', 'proj-rep-001', 'Worker Directory & Assignment UI', 'Bob Jones', 'approved', 'medium', '2026-10-16', '2026-10-23', 0, NULL),
('sum-task-005', 'proj-rep-001', 'Unit III & IV Syllabus Integrations', 'Bob Jones', 'in_review', 'high', '2026-10-24', '2026-10-29', 0, NULL);
