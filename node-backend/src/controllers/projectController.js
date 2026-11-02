import supabase from '../config/supabase.js';
import { REVIEWER_VISIBLE_STATUSES, visibleProjectIds, pageParams, forbidden } from '../services/accessService.js';

const PROJECT_SELECT = `
  *,
  client:profiles!projects_client_id_fkey(id, display_name),
  manager:profiles!projects_manager_id_fkey(id, display_name)
`;

function visibleTask(user, task) {
  if (user.role === 'assignee') return task.assignee_id === user.id;
  if (user.role === 'reviewer') return REVIEWER_VISIBLE_STATUSES.includes(task.status);
  return true;
}

const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

export async function listProjects(req, res, next) {
  try {
    const { status, manager_id, client_id } = req.query;
    const { page, limit, from, to } = pageParams(req);

    let query = supabase
      .from('projects')
      .select(`${PROJECT_SELECT}, tasks(id, status, assignee_id)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const ids = await visibleProjectIds(req.user);
    if (ids !== null) {
      if (ids.length === 0) return res.json({ success: true, data: [], meta: { total: 0, page, limit } });
      query = query.in('id', ids);
    }

    if (status) query = query.eq('status', status);
    if (manager_id) query = query.eq('manager_id', manager_id);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error, count } = await query;
    if (error) throw error;

    // Task counts only include tasks the caller may see; ownership details are never exposed.
    const rows = data.map((p) => ({
      ...p,
      tasks: (p.tasks || [])
        .filter((t) => visibleTask(req.user, t))
        .map((t) => ({ id: t.id, status: t.status })),
    }));
    res.json({ success: true, data: rows, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`${PROJECT_SELECT}, tasks(id, title, status, priority, assignee_id, due_date)`)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw notFound('Project not found');

    const { user } = req;
    let tasks = data.tasks || [];
    if (user.role === 'client' && data.client_id !== user.id) throw forbidden();
    if (user.role === 'assignee') {
      tasks = tasks.filter((t) => t.assignee_id === user.id);
      if (tasks.length === 0) throw forbidden();
    }
    if (user.role === 'reviewer') {
      tasks = tasks.filter((t) => REVIEWER_VISIBLE_STATUSES.includes(t.status));
      if (tasks.length === 0) throw forbidden();
    }

    res.json({ success: true, data: { ...data, tasks } });
  } catch (err) {
    next(err);
  }
}

async function requireProfileWithRole(id, role, label) {
  const { data } = await supabase.from('profiles').select('id, role').eq('id', id).maybeSingle();
  if (!data || data.role !== role) throw bad(`${label} must be an existing ${role.replace('_', ' ')}`);
}

export async function createProject(req, res, next) {
  try {
    const { request_id, title, description, client_id, start_date, due_date } = req.body;
    const manager_id = req.body.manager_id || req.user.id;

    if (start_date && due_date && start_date > due_date) throw bad('Start date must not be after due date');
    await requireProfileWithRole(client_id, 'client', 'client_id');
    await requireProfileWithRole(manager_id, 'project_manager', 'manager_id');

    if (request_id) {
      const { data: reqRow } = await supabase.from('project_requests').select('id, client_id').eq('id', request_id).maybeSingle();
      if (!reqRow) throw bad('request_id does not reference an existing project request');
      if (reqRow.client_id !== client_id) throw bad('The request belongs to a different client');
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ request_id: request_id || null, title, description, client_id, manager_id, status: 'active', start_date, due_date })
      .select()
      .single();
    if (error) throw error;

    if (request_id) {
      await supabase.from('project_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', request_id);
    }

    await supabase.from('activity_logs').insert({
      project_id: data.id,
      task_id: null,
      actor_id: req.user.id,
      action: 'project_created',
      details: { title },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { data: existing } = await supabase
      .from('projects')
      .select('id, start_date, due_date')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!existing) throw notFound('Project not found');

    const allowed = ['title', 'description', 'status', 'start_date', 'due_date', 'manager_id'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) throw bad('No updatable fields supplied');

    const start = updates.start_date ?? existing.start_date;
    const due = updates.due_date ?? existing.due_date;
    if (start && due && String(start) > String(due)) throw bad('Start date must not be after due date');
    if (updates.manager_id) await requireProfileWithRole(updates.manager_id, 'project_manager', 'manager_id');

    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) throw notFound('Project not found');

    await supabase.from('activity_logs').insert({
      project_id: data.id,
      task_id: null,
      actor_id: req.user.id,
      action: 'project_updated',
      details: { fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
