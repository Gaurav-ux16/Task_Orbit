import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
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

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-xs text-ink-muted mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary btn" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />

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
