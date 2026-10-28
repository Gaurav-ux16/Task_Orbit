import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProjectRequests, selectProjectRequests, selectProjectRequestsLoading } from '../../features/clients/projectRequestsSlice';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';
import { NewProjectModal } from './NewProjectModal';
import { useState } from 'react';
import { Plus } from 'lucide-react';

export function ManagerRequestsPage() {
  const dispatch = useDispatch();
  const requests = useSelector(selectProjectRequests);
  const loading = useSelector(selectProjectRequestsLoading);
  const error = useSelector((s) => s.projectRequests.error);
  const [newProjectFor, setNewProjectFor] = useState(null);

  useEffect(() => { dispatch(fetchProjectRequests()); }, [dispatch]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Project Requests</h1>
          <p className="text-xs text-ink-muted mt-0.5">Submitted by clients</p>
        </div>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />
        {loading ? <LoadingState /> : (
          <div className="panel overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-ink-muted">No project requests yet.</td></tr>
                ) : requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-ink-muted mt-0.5 max-w-sm truncate">{r.description}</div>
                    </td>
                    <td><PriorityBadge priority={r.priority} /></td>
                    <td className="text-xs text-ink-light">{formatDate(r.requested_deadline)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-xs text-ink-muted">{formatDate(r.created_at)}</td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          className="btn-primary btn btn-sm"
                          onClick={() => setNewProjectFor(r)}
                        >
                          <Plus size={12} /> Create Project
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {newProjectFor && (
        <NewProjectModal
          prefillRequestId={newProjectFor.id}
          onClose={() => setNewProjectFor(null)}
        />
      )}
    </>
  );
}
