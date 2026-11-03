import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Download, ListChecks, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { reportsApi } from '../../services/taskOrbitApi';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../context/ToastContext';
import { fetchProjects, selectProjects, selectProjectsLoading } from '../../features/projects/projectsSlice';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';
import { NewProjectModal } from './NewProjectModal';

export function ManagerProjectsPage() {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const loading = useSelector(selectProjectsLoading);
  const error = useSelector((s) => s.projects.error);
  const [showNew, setShowNew] = useState(false);
  const [summary, setSummary] = useState(null);
  const { notify } = useToast();

  useEffect(() => {
    reportsApi.summary().then((r) => setSummary(r.data.data)).catch(() => setSummary(null));
  }, [projects.length]);

  async function exportCsv() {
    try {
      const res = await reportsApi.tasksCsv();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'taskorbit-tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
      notify('Task report downloaded');
    } catch (err) {
      notify(err.friendlyMessage || 'Export failed', 'error');
    }
  }

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-xs text-ink-muted mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary btn" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-primary btn" onClick={() => setShowNew(true)}>
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />

        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5" aria-label="Portfolio summary">
            <StatCard label="Active projects" value={summary.projects.active} hint={`${summary.projects.total} total`} icon={Layers} />
            <StatCard label="Open tasks" value={summary.tasks.total - summary.tasks.by_status.approved} hint={`${summary.tasks.by_status.in_review + summary.tasks.by_status.submitted} awaiting review`} tone="amber" icon={ListChecks} />
            <StatCard label="Overdue" value={summary.tasks.overdue} hint="not yet approved" tone="red" icon={AlertTriangle} />
            <StatCard label="Completion" value={`${summary.tasks.completion_pct}%`} hint={`${summary.tasks.by_status.approved} approved`} tone="green" icon={CheckCircle2} />
          </div>
        )}

        {loading ? <LoadingState /> : projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={36} className="mb-3 text-surface-2" />
            <p className="font-medium text-ink">No projects yet</p>
            <p className="text-sm mt-1">Create a project from a client request to get started.</p>
            <button className="btn-primary btn mt-4" onClick={() => setShowNew(true)}>
              <Plus size={14} /> New Project
            </button>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Tasks</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/manager/projects/${p.id}`} className="font-medium hover:text-accent">
                        {p.title}
                      </Link>
                    </td>
                    <td className="text-ink-light">{p.client?.display_name || '—'}</td>
                    <td className="text-ink-light">{p.manager?.display_name || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-ink-light">{formatDate(p.due_date)}</td>
                    <td className="text-ink-muted">{p.tasks?.length ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </>
  );
}
