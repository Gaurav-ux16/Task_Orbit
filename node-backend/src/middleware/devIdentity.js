// ============================================================
// DEV IDENTITY FIXTURE — NOT PRODUCTION AUTHENTICATION
// In production, replace this with verified Supabase Auth JWTs.
// The client-supplied X-Dev-User-Id and X-Dev-Role headers are
// trusted ONLY in development mode. Never trust them in production.
// ============================================================

const DEV_PROFILES = {
  'client-001': { id: 'client-001', display_name: 'Alice (Client)', role: 'client' },
  'manager-001': { id: 'manager-001', display_name: 'Bob (Manager)', role: 'project_manager' },
  'assignee-001': { id: 'assignee-001', display_name: 'Carol (Dev)', role: 'assignee' },
  'assignee-002': { id: 'assignee-002', display_name: 'Dave (Dev)', role: 'assignee' },
  'reviewer-001': { id: 'reviewer-001', display_name: 'Eve (Reviewer)', role: 'reviewer' },
};

/**
 * Middleware: attach a dev identity to req.user from request headers.
 * Must be replaced by Supabase Auth verification in production.
 */
export function devIdentityMiddleware(req, res, next) {
  const userId = req.headers['x-dev-user-id'];
  const profile = DEV_PROFILES[userId];

  if (profile) {
    req.user = profile;
  } else {
    // Default to manager for demo convenience when no header is sent
    req.user = DEV_PROFILES['manager-001'];
  }

  next();
}

export { DEV_PROFILES };
