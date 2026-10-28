-- ============================================================================
-- TASKORBIT — PRODUCTION DATABASE RESET & REBUILD MIGRATION
-- Target Database: PacePilot (https://ziuwnkdvoabzlmjiwpsi.supabase.co)
-- Authoritative Schema: TaskOrbit Research Paper Architecture
-- ============================================================================
-- CRITICAL SAFETY NOTICE:
-- The Supabase dashboard marks the target branch as PRODUCTION.
-- 1. DO NOT run this script before creating a full backup in the Supabase Dashboard:
--    Dashboard -> Project Settings -> Database -> Database Backups -> "Backup now"
--    Or via pg_dump:
--    pg_dump "postgres://postgres:[YOUR-PASSWORD]@db.ziuwnkdvoabzlmjiwpsi.supabase.co:5432/postgres" > backup_pacepilot_pre_migration.sql
-- 2. This script drops legacy TaskOrbit tables (users, requirements, user_settings, etc.)
--    and builds the 7 core research-paper tables matching the current React + Express app.
-- ============================================================================

BEGIN;

-- ── 1. EXTENSIONS ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. SAFE TEARDOWN OF LEGACY & OUTDATED TABLES ──────────────────────────────
-- Dropped in reverse foreign-key dependency order
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.project_documents CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.project_requests CASCADE;
DROP TABLE IF EXISTS public.requirements CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── 3. CORE TABLE DEFINITIONS ─────────────────────────────────────────────────

-- Table 1: PROFILES (User directory & roles matching TaskOrbit state machine)
CREATE TABLE public.profiles (
  id           TEXT PRIMARY KEY,  -- Supports fixtures ('client-001') and Supabase Auth UUIDs
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('client', 'project_manager', 'assignee', 'reviewer')),
  skills       TEXT[] DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'on_leave')),
  email        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: PROJECT REQUESTS (Client requirements scoping module)
CREATE TABLE public.project_requests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          TEXT NOT NULL CONSTRAINT project_requests_client_id_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  requirements       TEXT,
  priority           TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  requested_deadline DATE,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: PROJECTS (Authoritative projects module)
CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID CONSTRAINT projects_request_id_fkey REFERENCES public.project_requests(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  client_id   TEXT NOT NULL CONSTRAINT projects_client_id_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  manager_id  TEXT NOT NULL CONSTRAINT projects_manager_id_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  start_date  DATE,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT projects_date_check CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

-- Table 4: TASKS (6 research paper states, conflict flags, monotonic submission ref)
CREATE TABLE public.tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL CONSTRAINT tasks_project_id_fkey REFERENCES public.projects(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  assignee_id           TEXT CONSTRAINT tasks_assignee_id_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority              TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status                TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved')),
  start_date            DATE,
  due_date              DATE,
  latest_submission_id  UUID,  -- Constrained after submissions table definition
  latest_version_number INTEGER NOT NULL DEFAULT 0,
  has_conflict_override BOOLEAN NOT NULL DEFAULT FALSE,
  conflict_task_ids     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tasks_date_check CHECK (due_date IS NULL OR start_date IS NULL OR start_date <= due_date)
);

-- Table 5: SUBMISSIONS (Deliverable uploads, monotonically increasing versions)
CREATE TABLE public.submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL CONSTRAINT submissions_task_id_fkey REFERENCES public.tasks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  submitted_by   TEXT NOT NULL CONSTRAINT submissions_submitted_by_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_path      TEXT NOT NULL,   -- Supabase Storage path (in taskorbit-files bucket)
  file_name      TEXT NOT NULL,   -- Original file name
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT submissions_task_version_unique UNIQUE (task_id, version_number)
);

-- Add deferred foreign key for tasks.latest_submission_id
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_latest_submission_fkey
  FOREIGN KEY (latest_submission_id)
  REFERENCES public.submissions(id)
  ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- Table 6: REVIEWS (Formal reviewer approvals/revisions against specific submission IDs)
CREATE TABLE public.reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL CONSTRAINT reviews_task_id_fkey REFERENCES public.tasks(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL CONSTRAINT reviews_submission_id_fkey REFERENCES public.submissions(id) ON DELETE RESTRICT,
  reviewer_id   TEXT NOT NULL CONSTRAINT reviews_reviewer_id_fkey REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decision      TEXT NOT NULL CHECK (decision IN ('approved', 'revision')),
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: ACTIVITY LOGS (Auditable history of project & task mutations)
CREATE TABLE public.activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID CONSTRAINT activity_logs_project_id_fkey REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id    UUID CONSTRAINT activity_logs_task_id_fkey REFERENCES public.tasks(id) ON DELETE SET NULL,
  actor_id   TEXT CONSTRAINT activity_logs_actor_id_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatible Optional Table: FEEDBACK (Modernized for future client feedback modules)
CREATE TABLE public.feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL CONSTRAINT feedback_project_id_fkey REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id  TEXT NOT NULL CONSTRAINT feedback_client_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  response   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatible Optional Table: NOTIFICATIONS (User alert dispatch)
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL CONSTRAINT notifications_user_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. PERFORMANCE INDEXES ────────────────────────────────────────────────────
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_availability ON public.profiles(availability);

CREATE INDEX idx_project_requests_client ON public.project_requests(client_id);
CREATE INDEX idx_project_requests_status ON public.project_requests(status);

CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_manager ON public.projects(manager_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_conflict_scan ON public.tasks(assignee_id, status, start_date, due_date);

CREATE INDEX idx_submissions_task ON public.submissions(task_id);
CREATE INDEX idx_submissions_order ON public.submissions(task_id, version_number DESC);

CREATE INDEX idx_reviews_task ON public.reviews(task_id);
CREATE INDEX idx_reviews_submission ON public.reviews(submission_id);

CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_task ON public.activity_logs(task_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ── 5. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Backend Service-Role Policies (Full access for Express API — authoritative backend)
CREATE POLICY "service_role_profiles" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_project_requests" ON public.project_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_projects" ON public.projects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_tasks" ON public.tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_submissions" ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_reviews" ON public.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_activity_logs" ON public.activity_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_feedback" ON public.feedback FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Restricted User Policies (Requirement 9: Anonymous users are strictly DENIED direct table reads)
-- All client-side queries flow through the authoritative Express API.
-- Direct anon key access to profiles, projects, and tasks is disallowed by default.
CREATE POLICY "authenticated_view_own_profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "authenticated_view_assigned_tasks" ON public.tasks FOR SELECT TO authenticated
  USING (assignee_id = auth.uid()::text);

-- ── 6. DEVELOPMENT FIXTURE SEEDING (MINIMAL BASELINE FOR ROLE TESTING) ──────
-- Contains only the minimal development fixtures required by the current application UI.
-- Production deployments may skip or customize these inserts.

-- Insert the 5 core TaskOrbit role actors
INSERT INTO public.profiles (id, display_name, role, skills, availability, email) VALUES
  ('client-001',   'Alice Chen (Client)',            'client',          ARRAY['Product Management', 'Requirement Scoping'], 'available', 'alice@clientcorp.io'),
  ('manager-001',  'Bob Martinez (Project Manager)', 'project_manager', ARRAY['Agile', 'Sprint Planning', 'Risk Mitigation'],    'available', 'bob@taskorbit.io'),
  ('assignee-001', 'Carol Singh (Developer)',        'assignee',        ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL'],  'available', 'carol@taskorbit.io'),
  ('assignee-002', 'Dave Kim (Developer)',           'assignee',        ARRAY['Express.js', 'REST APIs', 'PostgreSQL', 'Docker'], 'busy',   'dave@taskorbit.io'),
  ('reviewer-001', 'Eve Johnson (Reviewer)',         'reviewer',        ARRAY['Code Review', 'QA Automation', 'Security Audits'], 'available', 'eve@taskorbit.io')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  skills = EXCLUDED.skills,
  availability = EXCLUDED.availability,
  email = EXCLUDED.email;

-- Seed Project Requests
INSERT INTO public.project_requests (id, client_id, title, description, requirements, priority, requested_deadline, status) VALUES
  (
    '11111111-0000-0000-0000-000000000001',
    'client-001',
    'E-Commerce Platform Redesign',
    'Complete overhaul of the customer-facing storefront and checkout process.',
    'Responsive design, payment gateway integration, inventory sync, and admin dashboard.',
    'high',
    '2026-12-31',
    'approved'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'client-001',
    'Internal HR Portal',
    'A self-service portal for employee leave management and payroll queries.',
    'Leave application, approval workflow, payroll slips, and reporting.',
    'medium',
    '2027-03-31',
    'pending'
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'client-001',
    'Mobile App — Field Service',
    'Native mobile app for field technicians to log and complete work orders.',
    'Offline mode, GPS tracking, photo capture, and signature collection.',
    'critical',
    '2026-11-30',
    'reviewing'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Active Projects
INSERT INTO public.projects (id, request_id, title, description, client_id, manager_id, status, start_date, due_date) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'E-Commerce Platform Redesign',
    'Full-stack redesign including new design system, React frontend, and Express API.',
    'client-001',
    'manager-001',
    'active',
    '2026-10-01',
    '2026-12-31'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    NULL,
    'Design System Library',
    'Standalone internal design system and component library.',
    'client-001',
    'manager-001',
    'active',
    '2026-09-15',
    '2026-11-30'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks (demonstrating all 6 research paper states + conflict scenarios)
INSERT INTO public.tasks (id, project_id, title, description, assignee_id, priority, status, start_date, due_date) VALUES
  (
    '33333333-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    'Design new checkout flow',
    'Wireframe and prototype the updated multi-step checkout UI.',
    'assignee-001',
    'high',
    'approved',
    '2026-10-01',
    '2026-10-15'
  ),
  (
    '33333333-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    'Implement product listing page',
    'Build the filterable, paginated product catalogue with search.',
    'assignee-001',
    'high',
    'in_review',
    '2026-10-10',
    '2026-10-25'
  ),
  (
    '33333333-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000001',
    'Payment gateway integration',
    'Integrate Stripe payment gateway with webhook support.',
    'assignee-001',
    'critical',
    'in_progress',
    '2026-10-20',
    '2026-11-05'
  ),
  (
    '33333333-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000001',
    'Admin dashboard — product management',
    'CRUD interface for product listings, categories and stock levels.',
    'assignee-002',
    'medium',
    'submitted',
    '2026-10-15',
    '2026-11-01'
  ),
  (
    '33333333-0000-0000-0000-000000000005',
    '22222222-0000-0000-0000-000000000001',
    'Order history and tracking page',
    'Customer-facing order status and shipment tracking.',
    'assignee-002',
    'medium',
    'revision',
    '2026-10-22',
    '2026-11-08'
  ),
  (
    '33333333-0000-0000-0000-000000000006',
    '22222222-0000-0000-0000-000000000001',
    'Write API documentation',
    'Document all REST endpoints using OpenAPI format.',
    'assignee-002',
    'low',
    'todo',
    '2026-11-01',
    '2026-11-20'
  ),
  (
    '33333333-0000-0000-0000-000000000007',
    '22222222-0000-0000-0000-000000000002',
    'Build button and input components',
    'Accessible, themed primitives with full unit test coverage.',
    'assignee-001',
    'medium',
    'todo',
    '2026-10-22',
    '2026-11-02'
  ),
  (
    '33333333-0000-0000-0000-000000000008',
    '22222222-0000-0000-0000-000000000002',
    'Theme provider & dark mode tokens',
    'CSS variable system for seamless light/dark mode switching.',
    'assignee-002',
    'medium',
    'todo',
    '2026-10-25',
    '2026-11-10'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Submissions & Reviews for Task 1 (demonstrating versioning & approval)
INSERT INTO public.submissions (id, task_id, version_number, submitted_by, file_path, file_name, description) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    1,
    'assignee-001',
    'tasks/33333333-0000-0000-0000-000000000001/checkout-v1.zip',
    'checkout-v1.zip',
    'Initial wireframe deliverables.'
  )
ON CONFLICT (id) DO NOTHING;

UPDATE public.tasks
SET latest_submission_id = '44444444-0000-0000-0000-000000000001', latest_version_number = 1
WHERE id = '33333333-0000-0000-0000-000000000001';

INSERT INTO public.reviews (id, task_id, submission_id, reviewer_id, decision, feedback) VALUES
  (
    '55555555-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000001',
    'reviewer-001',
    'approved',
    'Wireframes are clean, accessible, and ready for development.'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
