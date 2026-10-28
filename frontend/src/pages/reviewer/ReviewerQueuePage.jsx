import { useEffect, useState } from 'react';
import { reviewsApi } from '../../services/taskOrbitApi';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/Spinner';
import { formatDate } from '../../utils/format';
import { ErrorAlert } from '../../components/Alert';
import { Star, Clock } from 'lucide-react';
import { ReviewModal } from './ReviewModal';

export function ReviewerQueuePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await reviewsApi.getPending();
      setTasks(res.data.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Review Queue</h1>
          <p className="text-xs text-ink-muted mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} awaiting review</p>
        </div>
      </div>

      <div className="page-body">
        <ErrorAlert message={error} />

        {loading ? <LoadingState /> : tasks.length === 0 ? (
          <div className="empty-state">
            <Star size={36} className="mb-3 text-surface-2" />
            <p className="font-medium text-ink">Review queue is empty</p>
            <p className="text-sm mt-1">Tasks submitted for review will appear here.</p>
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th>Version</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedTask(t)}>
                    <td className="font-medium">{t.title}</td>
                    <td className="text-xs text-ink-muted">{t.project?.title || '—'}</td>
                    <td className="text-xs text-ink-light">{t.assignee?.display_name || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td className="text-xs text-ink-muted">
                      {t.latest_submission ? formatDate(t.latest_submission.created_at) : '—'}
                    </td>
                    <td className="text-xs font-medium">
                      {t.latest_submission ? `v${t.latest_submission.version_number}` : '—'}
                    </td>
                    <td>
                      <button className="btn-primary btn btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTask && (
        <ReviewModal
          task={selectedTask}
          onClose={() => { setSelectedTask(null); load(); }}
        />
      )}
    </>
  );
}
