import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, selectTasks, selectTasksLoading } from '../../features/tasks/tasksSlice';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate, isOverdue } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';
import { NewTaskModal } from './NewTaskModal';
import { projectsApi } from '../../services/taskOrbitApi';
import { Plus, Filter } from 'lucide-react';

const STATUSES = ['', 'todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved'];

export function ManagerTasksPage() {
  const dispatch = useDispatch();
  const tasks = useSelector(selectTasks);
  const loading = useSelector(selectTasksLoading);
  const error = useSelector((s) => s.tasks.error);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectsApi.list({ limit: 100 }).then((r) => setProjects(r.data.data || [])).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const params = {};
    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority = filterPriority;
    dispatch(fetchTasks(params));
  }, [dispatch, filterStatus, filterPriority]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Task Board</h1>
          <p className="text-xs text-ink-muted mt-0.5">{tasks.length} tasks</p>
        </div>
        <button className="btn-primary btn" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New Task
        </button>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <Filter size={14} className="text-ink-muted" />
          <select className="form-input w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select className="form-input w-32" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? <LoadingState /> : (
          <div className="panel overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-ink-muted">No tasks match the current filter.</td></tr>
                ) : tasks.map((t) => (
                  <tr key={t.id} className={isOverdue(t.due_date, t.status) ? 'bg-red-50/50' : ''}>
                    <td className="font-medium max-w-xs truncate">{t.title}</td>
                    <td className="text-ink-light text-xs">{t.project?.title || '—'}</td>
                    <td className="text-ink-light text-xs">{t.assignee?.display_name || '—'}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className={`text-xs ${isOverdue(t.due_date, t.status) ? 'text-red-600 font-medium' : 'text-ink-light'}`}>
                      {formatDate(t.due_date)}
                      {isOverdue(t.due_date, t.status) && ' ⚠'}
                    </td>
                    <td>
                      <button className="btn-ghost btn btn-sm" onClick={() => setEditTask(t)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && <NewTaskModal projects={projects} onClose={() => { setShowNew(false); dispatch(fetchTasks({})); }} />}
      {editTask && <NewTaskModal projectId={editTask.project_id} editTask={editTask} onClose={() => { setEditTask(null); dispatch(fetchTasks({})); }} />}
    </>
  );
}
