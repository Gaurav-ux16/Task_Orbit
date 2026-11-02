-- ============================================================
-- TaskOrbit Database Schema
-- Version: 2.0.0 (adds authentication & sessions — see migrations/001_auth_sessions.sql)
-- Compatible with Supabase PostgreSQL
-- ============================================================
-- Run this file in the Supabase SQL Editor to initialize the schema.
-- Safe to re-run: uses IF NOT EXISTS where possible.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES ──────────────────────────────────────────────────────────────────
-- Authentication is handled by the Express API (bcrypt + server-side sessions).
CREATE TABLE IF NOT EXISTS profiles (
  id           TEXT PRIMARY KEY,  -- Will be UUID from auth.users in production
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('client', 'project_manager', 'assignee', 'reviewer')),
  skills       TEXT[] DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'on_leave')),
  email        TEXT,
  password_hash TEXT,                       -- bcrypt; never returned by the API
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email_lower ON profiles (LOWER(email));

-- ── PROJECT REQUESTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  requirements       TEXT,
  priority           TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  requested_deadline DATE,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_requests_client_id ON project_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON project_requests(status);

-- ── PROJECTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID REFERENCES project_requests(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  client_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  manager_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_date_check CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ── TASKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status      TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved')),
  start_date  DATE,
  due_date    DATE,
  latest_submission_id UUID, -- References latest submission in submissions(id)
  latest_version_number INTEGER NOT NULL DEFAULT 0,
  has_conflict_override BOOLEAN NOT NULL DEFAULT FALSE,
  conflict_task_ids JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tasks_date_check CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ── SUBMISSIONS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  submitted_by   TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  file_path      TEXT NOT NULL,   -- Supabase Storage path
  file_name      TEXT NOT NULL,   -- Original filename
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (task_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);

-- ── REVIEWS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  reviewer_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'revision')),
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_reviews_submission_id ON reviews(submission_id);

-- ── ACTIVITY LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id    UUID REFERENCES tasks(id) ON DELETE SET NULL,
  actor_id   TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task_id ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ── SESSIONS / SECURITY HARDENING ─────────────────────────────────────────────
-- Run migrations/001_auth_sessions.sql after this file to create the sessions table,
-- enable row-level security and revoke credential columns from public roles.
