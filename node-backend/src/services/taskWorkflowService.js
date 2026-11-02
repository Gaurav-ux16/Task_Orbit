import supabase from '../config/supabase.js';

/**
 * Valid task status transitions defined by Section III-C of the research paper:
 * "TaskOrbit: A Workflow-Aware Collaborative Project Management System with Deadline Conflict Detection"
 *
 * Lifecycle:
 *   todo → in_progress (Assignee starts work)
 *   in_progress → submitted (Assignee submits deliverable)
 *   submitted → in_review (Reviewer begins quality inspection)
 *   in_review → approved (Reviewer approves deliverable — Terminal state)
 *   in_review → revision (Reviewer requests changes)
 *   revision → in_progress (Assignee resumes work on revisions)
 */
export const TRANSITIONS = {
  todo:        ['in_progress'],
  in_progress: ['submitted'],
  submitted:   ['in_review'],
  in_review:   ['approved', 'revision'],
  revision:    ['in_progress'],
  approved:    [], // Terminal state under research paper specification
};

/**
 * Role-based authorization rules for transitions (Section IV-A).
 * Defines permitted roles and whether assignee ownership is required.
 */
export const TRANSITION_AUTHORIZATION = {
  'todo->in_progress':     { roles: ['assignee', 'project_manager'], requiresOwnership: true },
  'in_progress->submitted':{ roles: ['assignee'],                    requiresOwnership: true },
  'submitted->in_review':  { roles: ['reviewer', 'project_manager'], requiresOwnership: false },
  'in_review->approved':   { roles: ['reviewer'],                    requiresOwnership: false },
  'in_review->revision':   { roles: ['reviewer'],                    requiresOwnership: false },
  'revision->in_progress': { roles: ['assignee', 'project_manager'], requiresOwnership: true },
};

/**
 * Validate whether a transition from currentStatus → nextStatus is structurally permitted.
 */
export function isValidTransition(currentStatus, nextStatus) {
  const allowed = TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Validate that an actor has permission to perform the requested transition on a task.
 * Enforces:
 * 1. Structural lifecycle validity (HTTP 409 on invalid transition)
 * 2. Role authorization (HTTP 403 if role not permitted)
 * 3. Assignee task ownership (HTTP 403 if assignee does not own the task)
 *
 * @param {Object} task - Task record
 * @param {string} nextStatus - Desired new status
 * @param {Object} actor - User initiating the transition { id, role }
 */
export function validateTransition(task, nextStatus, actor = {}) {
  // 1. Structural workflow transition validity check (HTTP 409 Conflict)
  if (!isValidTransition(task.status, nextStatus)) {
    throw Object.assign(
      new Error(
        `Invalid workflow transition from '${task.status}' to '${nextStatus}'. ` +
        `Permitted transitions from '${task.status}': [${(TRANSITIONS[task.status] || []).join(', ')}].`
      ),
      { status: 409 }
    );
  }

  // 2. Role-based authorization check (HTTP 403 Forbidden)
  const transitionKey = `${task.status}->${nextStatus}`;
  const rule = TRANSITION_AUTHORIZATION[transitionKey];

  if (!rule || !actor.role) {
    throw Object.assign(
      new Error('Access denied: a signed-in user with a role is required for this transition.'),
      { status: 403 }
    );
  }

  if (!rule.roles.includes(actor.role)) {
    throw Object.assign(
      new Error(
        `Access denied: Role '${actor.role}' is not authorized to transition task from '${task.status}' to '${nextStatus}'. ` +
        `Authorized roles: [${rule.roles.join(', ')}].`
      ),
      { status: 403 }
    );
  }

  // 3. Ownership validation (Section III-G & Section IV-A)
  // An assignee may only modify or transition tasks assigned directly to them.
  if (rule.requiresOwnership && actor.role === 'assignee' && task.assignee_id !== actor.id) {
    throw Object.assign(
      new Error('Access denied: You cannot transition a task that is not assigned to you.'),
      { status: 403 }
    );
  }
}

/**
 * Apply a status transition to a task, enforcing business rules and logging activity.
 *
 * @param {string} taskId
 * @param {string} nextStatus
 * @param {Object|string} actor - User object { id, role } or actorId string
 * @param {Object} details - Additional metadata for activity log
 * @returns {Promise<{ taskId: string, previousStatus: string, newStatus: string }>}
 */
export async function applyStatusTransition(taskId, nextStatus, actor, details = {}) {
  // Normalize actor parameter
  const actorObj = typeof actor === 'string' ? { id: actor, role: null } : (actor || {});

  // Fetch current task
  const { data: task, error: fetchErr } = await supabase
    .from('tasks')
    .select('id, status, project_id, assignee_id, latest_submission_id')
    .eq('id', taskId)
    .single();

  if (fetchErr || !task) {
    throw Object.assign(new Error('Task not found'), { status: 404 });
  }

  // Enforce workflow integrity and authorization (throws 409 or 403)
  validateTransition(task, nextStatus, actorObj);

  // Update task status
  const { error: updateErr } = await supabase
    .from('tasks')
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (updateErr) {
    throw Object.assign(new Error('Failed to update task status: ' + updateErr.message), { status: 500 });
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    project_id: task.project_id,
    task_id: taskId,
    actor_id: actorObj.id || null,
    action: `status_changed_to_${nextStatus}`,
    details: { previous_status: task.status, ...details },
  });

  return { taskId, previousStatus: task.status, newStatus: nextStatus };
}
