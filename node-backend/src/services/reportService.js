import supabase from '../config/supabase.js';

const STATUSES = ['todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved'];

/** Aggregates dashboard numbers for managers (counts only, no personal data beyond display names). */
export async function buildSummary(today = new Date()) {
  const [{ data: tasks }, { data: projects }, { data: workers }] = await Promise.all([
    supabase.from('tasks').select('id, status, due_date, assignee_id, project_id'),
    supabase.from('projects').select('id, status'),
    supabase.from('profiles').select('id, display_name').eq('role', 'assignee'),
  ]);

  const todayIso = today.toISOString().slice(0, 10);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  let overdue = 0;
  for (const t of tasks || []) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (t.status !== 'approved' && t.due_date && String(t.due_date) < todayIso) overdue += 1;
  }

  const total = (tasks || []).length;
  const approved = byStatus.approved;
  const workload = (workers || []).map((w) => ({
    id: w.id,
    display_name: w.display_name,
    open_tasks: (tasks || []).filter((t) => t.assignee_id === w.id && t.status !== 'approved').length,
  }));

  return {
    projects: { total: (projects || []).length, active: (projects || []).filter((p) => p.status === 'active').length },
    tasks: { total, by_status: byStatus, overdue, completion_pct: total ? Math.round((approved / total) * 100) : 0 },
    workload,
    generated_at: today.toISOString(),
  };
}

/** Spreadsheet formula injection guard: neutralise cells that start with = + - @ or control chars. */
export function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const TASK_CSV_HEADER = ['task', 'project', 'assignee', 'priority', 'status', 'start_date', 'due_date'];

/** Async generator yielding CSV lines so large exports never sit fully in memory. */
export async function* taskCsvLines() {
  yield `${TASK_CSV_HEADER.join(',')}\n`;
  const { data } = await supabase
    .from('tasks')
    .select(`
      id, title, priority, status, start_date, due_date,
      assignee:profiles!tasks_assignee_id_fkey(id, display_name),
      project:projects(id, title)
    `)
    .order('due_date', { ascending: true });

  for (const t of data || []) {
    yield `${[t.title, t.project?.title, t.assignee?.display_name, t.priority, t.status, t.start_date, t.due_date].map(csvCell).join(',')}\n`;
  }
}
