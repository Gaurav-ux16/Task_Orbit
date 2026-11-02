import supabase from '../config/supabase.js';
import { pageParams, visibleProjectIds, forbidden, REVIEWER_VISIBLE_STATUSES } from '../services/accessService.js';

/** Actions that are safe to show to people outside the delivery team. */
const EXTERNAL_ACTIONS = new Set([
  'project_created',
  'project_updated',
  'task_created',
  'status_changed_to_submitted',
  'status_changed_to_approved',
  'status_changed_to_revision',
]);

const redact = (entry) => ({
  id: entry.id,
  project_id: entry.project_id,
  task_id: entry.task_id,
  action: entry.action,
  created_at: entry.created_at,
  actor: entry.actor,
  details: null,
});

export async function getProjectActivity(req, res, next) {
  try {
    const { projectId } = req.params;
    const { user } = req;
    const { page, limit, from, to } = pageParams(req, { defaultLimit: 50 });

    const ids = await visibleProjectIds(user);
    if (ids !== null && !ids.includes(projectId)) throw forbidden();

    let query = supabase
      .from('activity_logs')
      .select('*, actor:profiles!activity_logs_actor_id_fkey(id, display_name, role)', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Assignees see only entries for their own tasks.
    if (user.role === 'assignee') {
      const { data: mine } = await supabase.from('tasks').select('id').eq('project_id', projectId).eq('assignee_id', user.id);
      const taskIds = (mine || []).map((t) => t.id);
      if (taskIds.length === 0) return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
      query = query.in('task_id', taskIds);
    }
    if (user.role === 'reviewer') {
      const { data: visible } = await supabase.from('tasks').select('id').eq('project_id', projectId).in('status', REVIEWER_VISIBLE_STATUSES);
      const taskIds = (visible || []).map((t) => t.id);
      if (taskIds.length === 0) return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
      query = query.in('task_id', taskIds);
    }
    if (user.role === 'client') query = query.in('action', [...EXTERNAL_ACTIONS]);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = user.role === 'client' ? data.map(redact) : data;
    res.json({ success: true, data: rows, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
}

/** Manager-only: full profiles (incl. e-mail, skills) — never exposes credentials. */
export async function getProfiles(req, res, next) {
  try {
    const { role } = req.query;
    let query = supabase
      .from('profiles')
      .select('id, display_name, role, skills, availability, email')
      .order('display_name');
    if (role) query = query.eq('role', role);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWorkersDirectory(req, res, next) {
  try {
    const { data: workers, error: workerErr } = await supabase
      .from('profiles')
      .select('id, display_name, role, skills, availability, email')
      .eq('role', 'assignee')
      .order('display_name');
    if (workerErr) throw workerErr;

    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select(`
        id, title, status, priority, start_date, due_date, project_id,
        latest_version_number, assignee_id, has_conflict_override, conflict_task_ids,
        project:projects(id, title)
      `)
      .order('due_date', { ascending: true });
    if (taskErr) throw taskErr;

    const result = (workers || []).map((w) => {
      const assignedTasks = (tasks || []).filter((t) => t.assignee_id === w.id);
      const activeTasks = assignedTasks.filter((t) => ['todo', 'in_progress', 'revision'].includes(t.status));
      const inReviewTasks = assignedTasks.filter((t) => ['submitted', 'in_review'].includes(t.status));
      const approvedTasks = assignedTasks.filter((t) => t.status === 'approved');
      return {
        ...w,
        workload: {
          total_tasks: assignedTasks.length,
          active_tasks_count: activeTasks.length,
          in_review_count: inReviewTasks.length,
          approved_count: approvedTasks.length,
        },
        active_tasks: activeTasks,
        all_tasks: assignedTasks,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
