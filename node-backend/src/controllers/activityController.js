import supabase from '../config/supabase.js';

export async function getProjectActivity(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { data, error, count } = await supabase
      .from('activity_logs')
      .select(`
        *,
        actor:profiles!activity_logs_actor_id_fkey(id, display_name, role)
      `, { count: 'exact' })
      .eq('project_id', req.params.projectId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    res.json({ success: true, data, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    next(err);
  }
}

export async function getProfiles(req, res, next) {
  try {
    const { role } = req.query;
    let query = supabase.from('profiles').select('id, display_name, role, skills, availability, email').order('display_name');
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

    const workersWithWorkload = (workers || []).map((w) => {
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

    res.json({ success: true, data: workersWithWorkload });
  } catch (err) {
    next(err);
  }
}
