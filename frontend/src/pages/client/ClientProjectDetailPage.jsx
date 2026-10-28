import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, CheckSquare, Download, Layers, ShieldCheck } from 'lucide-react';
import { projectsApi, tasksApi, submissionsApi } from '../../services/taskOrbitApi';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState, Spinner } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';

export function ClientProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await projectsApi.get(id);
      setProject(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleAcceptProject() {
    if (!window.confirm('Mark this project as fully accepted and completed?')) return;
    setUpdating(true);
    try {
      await projectsApi.update(id, { status: 'completed' });
      await load();
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to update project status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error || !project) return <div className="page-body"><ErrorAlert message={error || 'Project not found'} /></div>;

  const tasks = project.tasks || [];
  const approvedTasks = tasks.filter((t) => t.status === 'approved');
  const inReviewTasks = tasks.filter((t) => t.status === 'in_review');
  const progressPct = tasks.length > 0 ? Math.round((approvedTasks.length / tasks.length) * 100) : 0;
  const isReadyForAcceptance = tasks.length > 0 && approvedTasks.length === tasks.length && project.status !== 'completed';

  return (
    <>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/client/projects" className="btn-secondary btn btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-ink">{project.title}</h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Managed by {project.manager?.display_name || 'PM'} • Deadline: {formatDate(project.due_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={project.status} />
          {isReadyForAcceptance && (
            <button
              className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              onClick={handleAcceptProject}
              disabled={updating}
            >
              {updating ? <Spinner size={14} className="text-white" /> : <ShieldCheck size={15} />}
              Accept & Complete Project
            </button>
          )}
        </div>
      </div>

      <div className="page-body space-y-6">
        {/* Progress & Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="panel p-4">
            <span className="text-2xs text-ink-muted uppercase tracking-wide block">Completion Progress</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-ink">{progressPct}%</span>
              <span className="text-xs text-ink-muted">({approvedTasks.length}/{tasks.length} tasks)</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-accent h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="panel p-4">
            <span className="text-2xs text-ink-muted uppercase tracking-wide block">Approved Deliverables</span>
            <span className="text-2xl font-bold text-emerald-700 mt-2 block">{approvedTasks.length}</span>
            <span className="text-2xs text-ink-muted mt-1 block">Inspected and approved by QA/Reviewer</span>
          </div>

          <div className="panel p-4">
            <span className="text-2xs text-ink-muted uppercase tracking-wide block">Under Review</span>
            <span className="text-2xl font-bold text-amber-700 mt-2 block">{inReviewTasks.length}</span>
            <span className="text-2xs text-ink-muted mt-1 block">Awaiting reviewer sign-off</span>
          </div>

          <div className="panel p-4">
            <span className="text-2xs text-ink-muted uppercase tracking-wide block">Target Completion</span>
            <span className="text-base font-semibold text-ink mt-2 block">{formatDate(project.due_date)}</span>
            <span className="text-2xs text-ink-muted mt-1 block">Started: {formatDate(project.start_date)}</span>
          </div>
        </div>

        {/* Project Description */}
        {project.description && (
          <div className="panel p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Project Scope</h2>
            <p className="text-xs text-ink-light leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Tasks Breakdown */}
        <div className="panel overflow-hidden">
          <div className="p-3.5 border-b border-surface-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Work Packages & Deliverables</h2>
            <span className="text-xs text-ink-muted">{tasks.length} tasks scheduled</span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-muted">No tasks defined for this project yet.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Deliverable</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-ink">{t.title}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td className="text-xs text-ink-muted">{formatDate(t.due_date)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
