import supabase from '../config/supabase.js';

/**
 * Deadline Conflict Detection Service
 *
 * Implements the overlap formula:
 *   sc <= di && si <= dc
 *
 * A conflict exists when:
 * - Same assignee
 * - Date intervals overlap
 * - Task is NOT approved
 * - Task is NOT the task being edited (excludeTaskId)
 */

/**
 * Detect conflicts for a proposed task assignment.
 *
 * @param {string} assigneeId - The user being assigned
 * @param {string} startDate  - Proposed start date (ISO string)
 * @param {string} dueDate    - Proposed due date (ISO string)
 * @param {string|null} excludeTaskId - Task id to exclude (when editing)
 * @returns {{ conflicts: Array, hasConflicts: boolean }}
 */
export async function detectConflicts(assigneeId, startDate, dueDate, excludeTaskId = null) {
  if (!assigneeId || !startDate || !dueDate) {
    throw Object.assign(new Error('assigneeId, startDate, and dueDate are required'), { status: 400 });
  }

  const sc = new Date(startDate);
  const dc = new Date(dueDate);

  if (sc > dc) {
    throw Object.assign(new Error('startDate must not be after dueDate'), { status: 400 });
  }

  // Fetch all relevant tasks for this assignee (not approved)
  let query = supabase
    .from('tasks')
    .select('id, title, start_date, due_date, status, project_id')
    .eq('assignee_id', assigneeId)
    .not('status', 'eq', 'approved');

  if (excludeTaskId) {
    query = query.not('id', 'eq', excludeTaskId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    throw Object.assign(new Error('Failed to fetch tasks for conflict check: ' + error.message), { status: 500 });
  }

  const conflicts = [];

  for (const task of tasks) {
    if (!task.start_date || !task.due_date) continue;

    const si = new Date(task.start_date);
    const di = new Date(task.due_date);

    // Overlap: sc <= di && si <= dc
    if (sc <= di && si <= dc) {
      conflicts.push({
        id: task.id,
        title: task.title,
        start_date: task.start_date,
        due_date: task.due_date,
        status: task.status,
        project_id: task.project_id,
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
