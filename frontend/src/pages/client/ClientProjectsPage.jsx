import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';
import { projectsApi } from '../../services/taskOrbitApi';
import { selectCurrentUser } from '../../app/devIdentitySlice';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';

export function ClientProjectsPage() {
  const currentUser = useSelector(selectCurrentUser);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await projectsApi.list({ client_id: currentUser.id });
        setProjects(res.data.data || []);
      } catch (err) {
        setError(err.friendlyMessage || 'Failed to load client projects');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser.id]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Project Progress</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time tracking of deliverables, milestone deadlines, and project execution
          </p>
        </div>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />

        {loading ? (
          <LoadingState />
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={36} className="mb-3 text-surface-2" />
            <p className="font-medium text-ink">No active projects yet</p>
            <p className="text-sm mt-1">Once a manager approves your project request, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="panel p-5 flex flex-col justify-between hover:border-accent-light transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-base text-ink">{proj.title}</h2>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-xs text-ink-light line-clamp-2 mb-4">{proj.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted bg-surface-1 p-3 rounded mb-4 border border-surface-2">
                    <div>
                      <span className="text-2xs text-ink-muted block uppercase tracking-wide">Project Manager</span>
                      <span className="font-medium text-ink mt-0.5 block">{proj.manager?.display_name || 'Assigned PM'}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-ink-muted block uppercase tracking-wide">Target Deadline</span>
                      <span className="font-medium text-ink mt-0.5 block">{formatDate(proj.due_date)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <Calendar size={13} />
                    <span>Started {formatDate(proj.start_date)}</span>
                  </div>
                  <Link
                    to={`/client/projects/${proj.id}`}
                    className="btn-primary btn btn-xs flex items-center gap-1"
                  >
                    View Deliverables <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
