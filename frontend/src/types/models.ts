/** Domain types shared by the UI (Unit V: TypeScript integration). */

export type Role = 'client' | 'project_manager' | 'assignee' | 'reviewer';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'in_review' | 'revision' | 'approved';

export interface User {
  id: string;
  display_name: string;
  role: Role;
  email?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  assignee_id?: string | null;
  priority: Priority;
  status: TaskStatus;
  start_date?: string | null;
  due_date?: string | null;
  latest_version_number?: number;
  has_conflict_override?: boolean;
  conflict_task_ids?: string[];
}

export interface SummaryReport {
  projects: { total: number; active: number };
  tasks: {
    total: number;
    by_status: Record<TaskStatus, number>;
    overdue: number;
    completion_pct: number;
  };
  workload: { id: string; display_name: string; open_tasks: number }[];
  generated_at: string;
}

/** Type guard used when reading untrusted JSON (e.g. persisted preferences). */
export function isTheme(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}
