import supabase from '../config/supabase.js';
import { detectConflicts } from '../services/conflictService.js';
import { applyStatusTransition } from '../services/taskWorkflowService.js';
import {
  scopeTaskQuery,
  clientProjectIds,
  pageParams,
  requireTaskAccess,
  forbidden,
} from '../services/accessService.js';

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const conflict = (msg, extra = {}) => Object.assign(new Error(msg), { status: 409, ...extra });
const notFound = (msg = 'Task not found') => Object.assign(new Error(msg), { status: 404 });

const TASK_LIST_SELECT = `
  *,
  assignee:profiles!tasks_assignee_id_fkey(id, display_name),
  project:projects(id, title)
`;

export async function listTasks(req, res, next) {
  try {
    const { project_id, assignee_id, status, priority } = req.query;
    const { page, limit, from, to } = pageParams(req, { defaultLimit: 50 });

    let query = supabase
      .from('tasks')
      .select(TASK_LIST_SELECT, { count: 'exact' })
      .order('due_date', { ascending: true })
      .range(from, to);

    query = scopeTaskQuery(query, req.user);

    if (req.user.role === 'client') {
      const ids = await clientProjectIds(req.user.id);
      if (ids.length === 0) return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
      query = query.in('project_id', ids);
    }

    if (project_id) query = query.eq('project_id', project_id);
    if (assignee_id && req.user.role !== 'assignee') query = query.eq('assignee_id', assignee_id);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await requireTaskAccess(req.user, req.params.id);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, display_name, role),
        project:projects(id, title, client_id, manager_id)
      `)
      .eq('id', task.id)
      .single();
    if (error || !data) throw notFound();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function requireAssignee(id) {
  const { data } = await supabase.from('profiles').select('id, role').eq('id', id).maybeSingle();
  if (!data || data.role !== 'assignee') throw bad('assignee_id must reference an existing assignee');
}

/** Two-way conflict bookkeeping once a manager explicitly overrides. */
async function recordConflictOverride(task, conflicts, actorId, assigneeId) {
  for (const other of conflicts) {
    const { data: ct } = await supabase.from('tasks').select('conflict_task_ids').eq('id', other.id).single();
    const existingIds = Array.isArray(ct?.conflict_task_ids) ? ct.conflict_task_ids : [];
    await supabase
      .from('tasks')
      .update({ has_conflict_override: true, conflict_task_ids: Array.from(new Set([...existingIds, task.id])) })
      .eq('id', other.id);
  }
  await supabase.from('activity_logs').insert({
    project_id: task.project_id,
    task_id: task.id,
    actor_id: actorId,
    action: 'conflict_override_confirmed',
    details: { candidate_task_id: task.id, conflict_task_ids: conflicts.map((c) => c.id), assignee_id: assigneeId },
  });
}

const conflictResponse = (res, result) =>
  res.status(409).json({
    success: false,
    error: 'Scheduling conflict detected: Candidate task overlaps with existing assigned task(s). Explicit override confirmation required.',
    hasConflicts: true,
    conflicts: result.conflicts,
  });

export async function createTask(req, res, next) {
  try {
    const { project_id, title, description, assignee_id, priority, start_date, due_date, override_conflicts } = req.body;

    if (start_date > due_date) throw bad('Start date must not be after due date');

    const { data: project } = await supabase.from('projects').select('id, status').eq('id', project_id).maybeSingle();
    if (!project) throw bad('project_id does not reference an existing project');
    if (['completed', 'cancelled'].includes(project.status)) {
      throw conflict(`Tasks cannot be added to a ${project.status} project.`);
    }
    if (assignee_id) await requireAssignee(assignee_id);

    let conflictResult = { hasConflicts: false, conflicts: [] };
    if (assignee_id) conflictResult = await detectConflicts(assignee_id, start_date, due_date);

    if (conflictResult.hasConflicts && !override_conflicts) return conflictResponse(res, conflictResult);

    const overridden = conflictResult.hasConflicts && Boolean(override_conflicts);
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id,
        title,
        description,
        assignee_id: assignee_id || null,
        priority,
        start_date,
        due_date,
        status: 'todo',
        has_conflict_override: overridden,
        conflict_task_ids: overridden ? conflictResult.conflicts.map((c) => c.id) : [],
      })
      .select()
      .single();
    if (error) throw error;

    if (overridden) await recordConflictOverride(data, conflictResult.conflicts, req.user.id, assignee_id);

    await supabase.from('activity_logs').insert({
      project_id,
      task_id: data.id,
      actor_id: req.user.id,
      action: 'task_created',
      details: { title, assignee_id, priority, has_conflict_override: overridden },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, project_id, assignee_id, status, start_date, due_date, conflict_task_ids')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw notFound();

    const isAssignee = req.user.role === 'assignee';
    if (isAssignee) {
      if (existing.assignee_id !== req.user.id) throw forbidden('Access denied: You cannot update a task assigned to another developer.');
      const forbiddenKeys = Object.keys(req.body).filter((k) => k !== 'description');
      if (forbiddenKeys.length) {
        throw forbidden('Access denied: Assignees may only edit the description of their own tasks.');
      }
    }

    if (existing.status === 'approved') throw conflict("Task is 'approved' (terminal) and can no longer be edited.");

    const { override_conflicts } = req.body;
    const scheduleChanged = ['assignee_id', 'start_date', 'due_date'].some(
      (k) => req.body[k] !== undefined && String(req.body[k]) !== String(existing[k] ?? '')
    );

    const targetAssignee = req.body.assignee_id !== undefined ? req.body.assignee_id : existing.assignee_id;
    const targetStart = req.body.start_date ?? existing.start_date;
    const targetDue = req.body.due_date ?? existing.due_date;
    if (targetStart && targetDue && String(targetStart) > String(targetDue)) throw bad('Start date must not be after due date');
    if (req.body.assignee_id) await requireAssignee(req.body.assignee_id);

    let conflictResult = { hasConflicts: false, conflicts: [] };
    if (scheduleChanged && targetAssignee && targetStart && targetDue) {
      conflictResult = await detectConflicts(targetAssignee, targetStart, targetDue, req.params.id);
    }
    if (conflictResult.hasConflicts && !override_conflicts) return conflictResponse(res, conflictResult);

    const allowed = ['title', 'description', 'assignee_id', 'priority', 'start_date', 'due_date'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) throw bad('No updatable fields supplied');

    const overridden = conflictResult.hasConflicts && Boolean(override_conflicts);
    if (overridden) {
      updates.has_conflict_override = true;
      updates.conflict_task_ids = conflictResult.conflicts.map((c) => c.id);
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('tasks').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) throw notFound();

    if (overridden) await recordConflictOverride(data, conflictResult.conflicts, req.user.id, targetAssignee);

    await supabase.from('activity_logs').insert({
      project_id: data.project_id,
      task_id: data.id,
      actor_id: req.user.id,
      action: 'task_updated',
      details: { fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const result = await applyStatusTransition(req.params.id, req.body.status, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function previewConflicts(req, res, next) {
  try {
    const { assignee_id, start_date, due_date } = req.body;
    if (start_date > due_date) throw bad('Start date must not be after due date');
    const excludeTaskId = req.params.id !== 'new' ? req.params.id : null;
    const result = await detectConflicts(assignee_id, start_date, due_date, excludeTaskId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
