import supabase from '../config/supabase.js';

const VALID_STATUSES = ['pending', 'reviewing', 'approved', 'rejected'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export async function listProjectRequests(req, res, next) {
  try {
    const { status, client_id, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('project_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, data, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
}

export async function getProjectRequest(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('project_requests')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Project request not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createProjectRequest(req, res, next) {
  try {
    const { title, description, requirements, priority, requested_deadline } = req.body;
    const client_id = req.user.id;

    const { data, error } = await supabase
      .from('project_requests')
      .insert({ client_id, title, description, requirements, priority, requested_deadline, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    // Log activity (no project yet, so project_id is null)
    await supabase.from('activity_logs').insert({
      project_id: null,
      task_id: null,
      actor_id: client_id,
      action: 'project_request_submitted',
      details: { request_id: data.id, title },
    });

    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateProjectRequest(req, res, next) {
  try {
    const allowed = ['title', 'description', 'requirements', 'priority', 'requested_deadline', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('project_requests')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Project request not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
