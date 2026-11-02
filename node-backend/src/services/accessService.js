import supabase from '../config/supabase.js';

/**
 * Central authorisation helpers (resource-level access control).
 * Role guards on routes answer "may this ROLE call this endpoint?";
 * these helpers answer "may THIS USER see THIS record?".
 */

/** Task statuses a reviewer is allowed to see (the review pipeline). */
export const REVIEWER_VISIBLE_STATUSES = ['submitted', 'in_review', 'revision', 'approved'];

export const forbidden = (message = 'Access denied: you do not have permission to access this resource.') =>
  Object.assign(new Error(message), { status: 403 });

export function pageParams(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

/** Task rows for a user that exist in `tasks`, restricted to what their role may see. */
export function scopeTaskQuery(query, user) {
  switch (user.role) {
    case 'project_manager':
      return query;
    case 'assignee':
      return query.eq('assignee_id', user.id);
    case 'reviewer':
      return query.in('status', REVIEWER_VISIBLE_STATUSES);
    default:
      return query; // client: filtered by project ownership separately
  }
}

/** Ids of projects owned by a client. */
export async function clientProjectIds(clientId) {
  const { data } = await supabase.from('projects').select('id').eq('client_id', clientId);
  return (data || []).map((p) => p.id);
}

/**
 * Ids of projects a user may see, or `null` meaning "all projects".
 */
export async function visibleProjectIds(user) {
  if (user.role === 'project_manager') return null;
  if (user.role === 'client') return clientProjectIds(user.id);

  let q = supabase.from('tasks').select('project_id');
  q = user.role === 'assignee' ? q.eq('assignee_id', user.id) : q.in('status', REVIEWER_VISIBLE_STATUSES);
  const { data } = await q;
  return [...new Set((data || []).map((t) => t.project_id))];
}

/** Loads a task together with the owning project's client/manager. */
export async function loadTaskWithProject(taskId) {
  const { data } = await supabase
    .from('tasks')
    .select('*, project:projects(id, title, client_id, manager_id)')
    .eq('id', taskId)
    .maybeSingle();
  return data || null;
}

export function canViewTask(user, task) {
  switch (user.role) {
    case 'project_manager':
      return true;
    case 'client':
      return task.project?.client_id === user.id;
    case 'assignee':
      return task.assignee_id === user.id;
    case 'reviewer':
      return REVIEWER_VISIBLE_STATUSES.includes(task.status);
    default:
      return false;
  }
}

/** Load a task and enforce visibility. Throws 404 / 403. */
export async function requireTaskAccess(user, taskId) {
  const task = await loadTaskWithProject(taskId);
  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
  if (!canViewTask(user, task)) throw forbidden();
  return task;
}

/** Fields of a profile that non-managers may see about someone else. */
export const publicProfileFields = (p) => (p ? { id: p.id, display_name: p.display_name, role: p.role } : null);
