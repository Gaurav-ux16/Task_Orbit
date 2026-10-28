-- ============================================================
-- TaskOrbit — Unit III Servlet & JSP Demo MySQL Schema
-- Educational Demonstration Database: taskorbit_servlet_demo
-- ============================================================
-- Note: This database is isolated for academic demonstration of JDBC.
-- It does NOT interfere with the primary TaskOrbit PostgreSQL database.
-- ============================================================

CREATE DATABASE IF NOT EXISTS taskorbit_servlet_demo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE taskorbit_servlet_demo;

-- ── DEMO WORKERS TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_workers (
  id              VARCHAR(64) PRIMARY KEY,
  display_name    VARCHAR(128) NOT NULL,
  role            VARCHAR(32) NOT NULL DEFAULT 'assignee',
  availability    VARCHAR(32) NOT NULL DEFAULT 'available',
  email           VARCHAR(128),
  skills          VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── DEMO TASKS TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_tasks (
  id              VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  assignee_id     VARCHAR(64),
  assignee_name   VARCHAR(128),
  status          VARCHAR(32) NOT NULL DEFAULT 'todo',
  priority        VARCHAR(32) NOT NULL DEFAULT 'medium',
  start_date      DATE,
  due_date        DATE,
  version_number  INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_demo_tasks_worker FOREIGN KEY (assignee_id)
    REFERENCES demo_workers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── DEMO FIXTURES ─────────────────────────────────────────────────────────────
INSERT INTO demo_workers (id, display_name, role, availability, email, skills) VALUES
  ('assignee-001', 'Carol Singh (Developer)', 'assignee', 'available', 'carol@taskorbit.io', 'React, TypeScript, Node.js'),
  ('assignee-002', 'Dave Kim (Developer)',    'assignee', 'busy',      'dave@taskorbit.io',  'Express.js, PostgreSQL, Docker')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT INTO demo_tasks (id, title, description, assignee_id, assignee_name, status, priority, start_date, due_date, version_number) VALUES
  ('task-101', 'Design Checkout Flow', 'Refactor UI components for checkout.', 'assignee-001', 'Carol Singh', 'in_progress', 'high', '2026-10-15', '2026-10-25', 1),
  ('task-102', 'Build Product Listing', 'Catalogue with search and pagination.', 'assignee-001', 'Carol Singh', 'submitted', 'medium', '2026-10-20', '2026-11-05', 2),
  ('task-103', 'Payment Gateway Integration', 'Stripe API webhook integration.', 'assignee-002', 'Dave Kim', 'todo', 'critical', '2026-11-01', '2026-11-15', 0)
ON DUPLICATE KEY UPDATE title = VALUES(title);
