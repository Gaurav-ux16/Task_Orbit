-- ============================================================
-- TaskOrbit migration 001 — authentication, sessions, hardening
-- Safe to re-run. Apply on top of schema.sql (or an existing DB).
-- ============================================================

-- ── Credentials & lock-out columns on profiles ───────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_logins  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until   TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

-- E-mail is the login identifier: unique, case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_email_lower ON profiles (LOWER(email));

-- ── Server-side sessions ─────────────────────────────────────────────────────
-- Only the SHA-256 of the cookie value is stored, so a database leak cannot be replayed.
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  csrf_token   TEXT NOT NULL,
  remember     BOOLEAN NOT NULL DEFAULT FALSE,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ── Row-level security: deny everything to anon/authenticated PostgREST roles ─
-- The Express API uses the service_role key (which bypasses RLS) and enforces
-- authorisation itself. With RLS enabled and NO policies, the public anon key
-- cannot read credentials, sessions or any other table directly.
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON sessions FROM anon, authenticated;
REVOKE SELECT (password_hash, failed_logins, locked_until) ON profiles FROM anon, authenticated;

-- ── Housekeeping helper (call from a scheduled job) ──────────────────────────
CREATE OR REPLACE FUNCTION purge_expired_sessions() RETURNS INTEGER AS $$
DECLARE removed INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$ LANGUAGE plpgsql;

-- ── Referential safety ────────────────────────────────────────────────────────
-- Prevent a second submission of the same version and a second review of one submission decision.
CREATE UNIQUE INDEX IF NOT EXISTS uq_submissions_task_version ON submissions(task_id, version_number);
