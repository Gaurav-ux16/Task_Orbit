import supabase from '../config/supabase.js';

export async function listProjects(req, res, next) {
  try {
    const { status, manager_id, client_id, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:profiles!projects_client_id_fkey(id, display_name),
        manager:profiles!projects_manager_id_fkey(id, display_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq('status', status);
    if (manager_id) query = query.eq('manager_id', manager_id);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:profiles!projects_client_id_fkey(id, display_name),
        manager:profiles!projects_manager_id_fkey(id, display_name),
        tasks(id, title, status, priority, assignee_id, due_date)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { request_id, title, description, client_id, manager_id, start_date, due_date } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .insert({ request_id, title, description, client_id, manager_id, status: 'active', start_date, due_date })
      .select()
      .single();

    if (error) throw error;

    // Update the request status to 'approved'
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
    const allowed = ['title', 'description', 'status', 'start_date', 'due_date', 'manager_id'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
