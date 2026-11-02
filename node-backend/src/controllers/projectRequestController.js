import supabase from '../config/supabase.js';
import { pageParams, forbidden } from '../services/accessService.js';

const notFound = () => Object.assign(new Error('Project request not found'), { status: 404 });

export async function listProjectRequests(req, res, next) {
  try {
    const { status, client_id } = req.query;
    const { page, limit, from, to } = pageParams(req);
    let query = supabase
      .from('project_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    // Clients can only ever see their own requests, whatever filter they pass.
    if (req.user.role === 'client') query = query.eq('client_id', req.user.id);
    else if (client_id) query = query.eq('client_id', client_id);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page, limit } });
  } catch (err) {
    next(err);
  }
}

async function loadAuthorised(req) {
  const { data, error } = await supabase.from('project_requests').select('*').eq('id', req.params.id).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  if (req.user.role === 'client' && data.client_id !== req.user.id) throw forbidden();
  return data;
}

export async function getProjectRequest(req, res, next) {
  try {
    res.json({ success: true, data: await loadAuthorised(req) });
  } catch (err) {
    next(err);
  }
}

export async function createProjectRequest(req, res, next) {
  try {
    const { title, description, requirements, priority, requested_deadline } = req.body;
    const client_id = req.user.id; // identity always comes from the session

    const { data, error } = await supabase
      .from('project_requests')
      .insert({ client_id, title, description, requirements, priority, requested_deadline, status: 'pending' })
      .select()
      .single();
    if (error) throw error;

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

const CLIENT_EDITABLE = ['title', 'description', 'requirements', 'priority', 'requested_deadline'];
const MANAGER_EDITABLE = [...CLIENT_EDITABLE, 'status'];

export async function updateProjectRequest(req, res, next) {
  try {
    const existing = await loadAuthorised(req);
    const isClient = req.user.role === 'client';

    // Clients may amend their own request only while it has not been picked up.
    if (isClient && existing.status !== 'pending') {
      throw Object.assign(new Error(`Request is '${existing.status}' and can no longer be edited by the client.`), { status: 409 });
    }
    if (isClient && req.body.status !== undefined) {
      throw forbidden('Access denied: clients cannot change the status of a request.');
    }
    if (existing.status === 'approved' && req.body.status !== undefined && req.body.status !== 'approved') {
      throw Object.assign(new Error('An approved request cannot change status.'), { status: 409 });
    }

    const allowed = isClient ? CLIENT_EDITABLE : MANAGER_EDITABLE;
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      throw Object.assign(new Error('No updatable fields supplied'), { status: 400 });
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('project_requests').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) throw notFound();

    await supabase.from('activity_logs').insert({
      project_id: null,
      task_id: null,
      actor_id: req.user.id,
      action: 'project_request_updated',
      details: { request_id: data.id, fields: Object.keys(updates).filter((k) => k !== 'updated_at') },
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
