import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, FileText } from 'lucide-react';
import { fetchProjectRequests, selectProjectRequests, selectProjectRequestsLoading } from '../../features/clients/projectRequestsSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { NewRequestModal } from './NewRequestModal';

export function ClientRequestsPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const requests = useSelector(selectProjectRequests);
  const loading = useSelector(selectProjectRequestsLoading);

  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    dispatch(fetchProjectRequests({ client_id: currentUser.id }));
  }, [dispatch, currentUser.id]);

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">My Project Requests</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Submit new project proposals and track manager review status
          </p>
        </div>
        <button
          className="btn-primary btn btn-sm flex items-center gap-1.5"
          onClick={() => setShowModal(true)}
        >
          <Plus size={15} />
          New Request
        </button>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filter-bar">
          <button
            className={`tab-btn ${filterStatus === '' ? 'active' : ''}`}
            onClick={() => setFilterStatus('')}
          >
            All Requests ({requests.length})
          </button>
          <button
            className={`tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button
            className={`tab-btn ${filterStatus === 'reviewing' ? 'active' : ''}`}
            onClick={() => setFilterStatus('reviewing')}
          >
            Reviewing
          </button>
          <button
            className={`tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            Approved
          </button>
          <button
            className={`tab-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected
          </button>
        </div>

        {loading && requests.length === 0 ? (
          <LoadingState />
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} className="mb-3 text-surface-2" />
            <p className="font-medium text-ink">No project requests found</p>
            <p className="text-sm mt-1">Submit your first project request using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((req) => (
              <div key={req.id} className="panel p-4 flex flex-col justify-between hover:border-accent-light transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-ink text-sm leading-snug line-clamp-1">{req.title}</h2>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-ink-light line-clamp-3 mb-3">{req.description}</p>

                  {req.requirements && (
                    <div className="text-2xs bg-surface-1 p-2 rounded mb-3 text-ink-muted border border-surface-2">
                      <span className="font-semibold block text-ink">Requirements:</span>
                      <p className="line-clamp-2 mt-0.5">{req.requirements}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-surface-2 flex items-center justify-between text-2xs text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={req.priority} />
                  </div>
                  <div>
                    Target: {req.requested_deadline ? formatDate(req.requested_deadline) : 'Flexible'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewRequestModal
          onClose={() => setShowModal(false)}
          onCreated={() => dispatch(fetchProjectRequests({ client_id: currentUser.id }))}
        />
      )}
    </>
  );
}
