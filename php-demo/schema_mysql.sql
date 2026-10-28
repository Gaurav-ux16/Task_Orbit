-- ============================================================
-- TaskOrbit PHP Demonstration Database Schema (MySQL)
-- Syllabus Topic: MySQL with PHP (Unit I)
-- ============================================================
-- This database table is strictly isolated for the PHP educational utility.
-- It does NOT replace or modify the primary TaskOrbit PostgreSQL database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS taskorbit_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskorbit_demo;

CREATE TABLE IF NOT EXISTS php_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL,
    task_title VARCHAR(255) NOT NULL,
    assignee_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NULL,
    file_name VARCHAR(255) NOT NULL,
    stored_file_path VARCHAR(255) NOT NULL,
    file_size_bytes INT NOT NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
