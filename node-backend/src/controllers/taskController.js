import supabase from '../config/supabase.js';
import { detectConflicts } from '../services/conflictService.js';
import { applyStatusTransition } from '../services/taskWorkflowService.js';

export async function listTasks(req, res, next) {
  try {
    const { project_id, assignee_id, status, priority, page = 1, limit = 50 } = req.query;
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, display_name),
        project:projects(id, title)
      `, { count: 'exact' })
      .order('due_date', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (project_id) query = query.eq('project_id', project_id);
    if (assignee_id) query = query.eq('assignee_id', assignee_id);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, display_name, role),
        project:projects(id, title, client_id, manager_id)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { project_id, title, description, assignee_id, priority, start_date, due_date, override_conflicts } = req.body;

    if (start_date && due_date && new Date(start_date) > new Date(due_date)) {
      return res.status(400).json({ success: false, error: 'Start date must not be after due date' });
    }

    let conflictResult = { hasConflicts: false, conflicts: [] };
    if (assignee_id && start_date && due_date) {
      conflictResult = await detectConflicts(assignee_id, start_date, due_date);
    }

    if (conflictResult.hasConflicts && !override_conflicts) {
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected: Candidate task overlaps with existing assigned task(s). Explicit override confirmation required.',
        hasConflicts: true,
        conflicts: conflictResult.conflicts,
      });
    }

    const taskPayload = {
      project_id,
      title,
      description,
      assignee_id,
      priority,
      start_date,
      due_date,
      status: 'todo',
      has_conflict_override: conflictResult.hasConflicts && Boolean(override_conflicts),
      conflict_task_ids: conflictResult.hasConflicts && Boolean(override_conflicts) ? conflictResult.conflicts.map((c) => c.id) : [],
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskPayload)
      .select()
      .single();

    if (error) throw error;

    // Two-way conflict references: update the conflicting existing task(s)
    if (conflictResult.hasConflicts && override_conflicts) {
      for (const conflicting of conflictResult.conflicts) {
        const { data: ct } = await supabase.from('tasks').select('conflict_task_ids').eq('id', conflicting.id).single();
        const existingIds = Array.isArray(ct?.conflict_task_ids) ? ct.conflict_task_ids : [];
        const updatedIds = Array.from(new Set([...existingIds, data.id]));
        await supabase.from('tasks').update({
          has_conflict_override: true,
          conflict_task_ids: updatedIds,
        }).eq('id', conflicting.id);
      }

      await supabase.from('activity_logs').insert({
        project_id,
        task_id: data.id,
        actor_id: req.user.id,
        action: 'conflict_override_confirmed',
        details: { candidate_task_id: data.id, conflict_task_ids: taskPayload.conflict_task_ids, assignee_id },
      });
    }

    await supabase.from('activity_logs').insert({
      project_id,
      task_id: data.id,
      actor_id: req.user.id,
      action: 'task_created',
      details: { title, assignee_id, priority, has_conflict_override: taskPayload.has_conflict_override },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    // 1. Fetch task to verify existence and check ownership
    const { data: existingTask, error: fetchErr } = await supabase
      .from('tasks')
      .select('id, project_id, assignee_id, status, start_date, due_date, conflict_task_ids')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existingTask) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // 2. Ownership & role validation (Section III-G of research paper)
    if (req.user?.role === 'assignee') {
      if (existingTask.assignee_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You cannot update a task assigned to another developer.',
        });
      }
      // Assignees cannot reassign tasks or alter project schedule boundaries
      if (req.body.assignee_id && req.body.assignee_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Assignees cannot reassign task ownership.',
        });
      }
    }

    const targetAssigneeId = req.body.assignee_id !== undefined ? req.body.assignee_id : existingTask.assignee_id;
    const targetStartDate = req.body.start_date !== undefined ? req.body.start_date : existingTask.start_date;
    const targetDueDate = req.body.due_date !== undefined ? req.body.due_date : existingTask.due_date;

    if (targetStartDate && targetDueDate && new Date(targetStartDate) > new Date(targetDueDate)) {
      return res.status(400).json({ success: false, error: 'Start date must not be after due date' });
    }

    // Check conflict if schedule or assignee was modified
    let conflictResult = { hasConflicts: false, conflicts: [] };
    if (targetAssigneeId && targetStartDate && targetDueDate) {
      conflictResult = await detectConflicts(targetAssigneeId, targetStartDate, targetDueDate, req.params.id);
    }

    if (conflictResult.hasConflicts && !req.body.override_conflicts) {
      return res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected: Candidate task overlaps with existing assigned task(s). Explicit override confirmation required.',
        hasConflicts: true,
        conflicts: conflictResult.conflicts,
      });
    }

    const allowed = ['title', 'description', 'assignee_id', 'priority', 'start_date', 'due_date'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (conflictResult.hasConflicts && req.body.override_conflicts) {
      updates.has_conflict_override = true;
      updates.conflict_task_ids = conflictResult.conflicts.map((c) => c.id);
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Task not found' });

    // Two-way conflict references
    if (conflictResult.hasConflicts && req.body.override_conflicts) {
      for (const conflicting of conflictResult.conflicts) {
        const { data: ct } = await supabase.from('tasks').select('conflict_task_ids').eq('id', conflicting.id).single();
        const existingIds = Array.isArray(ct?.conflict_task_ids) ? ct.conflict_task_ids : [];
        const updatedIds = Array.from(new Set([...existingIds, data.id]));
        await supabase.from('tasks').update({
          has_conflict_override: true,
          conflict_task_ids: updatedIds,
        }).eq('id', conflicting.id);
      }

      await supabase.from('activity_logs').insert({
        project_id: data.project_id,
        task_id: data.id,
        actor_id: req.user.id,
        action: 'conflict_override_confirmed',
        details: { candidate_task_id: data.id, conflict_task_ids: updates.conflict_task_ids, assignee_id: targetAssigneeId },
      });
    }

    await supabase.from('activity_logs').insert({
      project_id: data.project_id,
      task_id: data.id,
      actor_id: req.user.id,
      action: 'task_updated',
      details: updates,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { status } = req.body;
    // Pass the full req.user object for role and ownership verification
    const result = await applyStatusTransition(req.params.id, status, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function previewConflicts(req, res, next) {
  try {
    const { assignee_id, start_date, due_date } = req.body;
    const excludeTaskId = req.params.id !== 'new' ? req.params.id : null;

    const result = await detectConflicts(assignee_id, start_date, due_date, excludeTaskId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
