import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Clock } from 'lucide-react';
import { projectsApi } from '../../services/taskOrbitApi';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate, relativeTime } from '../../utils/format';
import { ErrorAlert, Alert } from '../../components/Alert';
import { NewTaskModal } from './NewTaskModal';

const STATUS_COLS = [
  { key: 'todo',        label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'submitted',   label: 'Submitted' },
  { key: 'in_review',   label: 'In Review' },
  { key: 'revision',    label: 'Revision' },
  { key: 'approved',    label: 'Approved' },
];

export function ManagerProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [proj, act] = await Promise.all([
        projectsApi.get(id),
        projectsApi.getActivity(id),
      ]);
      setProject(proj.data.data);
      setActivity(act.data.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <div className="page-body"><ErrorAlert message={error} /></div>;
  if (!project) return null;

  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = (project.tasks || []).filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/manager/projects" className="btn-ghost btn btn-sm p-1">
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              <span className="text-xs text-ink-muted">
                {formatDate(project.start_date)} — {formatDate(project.due_date)}
              </span>
            </div>
          </div>
        </div>
        <button className="btn-primary btn" onClick={() => setShowNewTask(true)}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      <div className="page-body space-y-6">
        {/* Task status summary */}
        <div className="panel overflow-hidden">
          <div className="panel-header">
            <h3 className="text-sm font-semibold">Task Board</h3>
            <span className="text-xs text-ink-muted">{(project.tasks || []).length} tasks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {(project.tasks || []).length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-ink-muted">No tasks yet — add the first task above.</td></tr>
                ) : (project.tasks || []).map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.title}</td>
                    <td className="text-ink-light">{t.assignee_id || '—'}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-ink-light">{formatDate(t.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-semibold">Activity</h3>
          </div>
          {activity.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted text-center">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-surface-2">
              {activity.map((entry) => (
                <li key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <Clock size={14} className="text-ink-faint mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm text-ink">{entry.actor?.display_name || 'System'}</span>
                    <span className="text-sm text-ink-muted mx-1">·</span>
                    <span className="text-sm text-ink-light">{entry.action.replace(/_/g, ' ')}</span>
                    <span className="block text-xs text-ink-faint mt-0.5">{relativeTime(entry.created_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showNewTask && (
        <NewTaskModal
          projectId={id}
          onClose={() => { setShowNewTask(false); load(); }}
        />
      )}
    </>
  );
}
