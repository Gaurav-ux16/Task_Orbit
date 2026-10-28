import { useEffect, useState, useRef } from 'react';
import { Modal } from '../../components/Modal';
import { Alert, ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { submissionsApi, reviewsApi, tasksApi } from '../../services/taskOrbitApi';
import { formatDate, formatDateTime, relativeTime } from '../../utils/format';
import { Upload, Download, ChevronDown, ChevronRight, MessageSquare } from 'lucide-react';

const SUBMITTABLE_STATUSES = ['in_progress', 'revision'];

export function TaskDetailModal({ task, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const [subRes, revRes] = await Promise.all([
        submissionsApi.list(task.id),
        reviewsApi.getForTask(task.id),
      ]);
      setSubmissions(subRes.data.data || []);
      setReviews(revRes.data.data || []);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [task.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Please select a file to submit');

    setSubmitting(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (description) fd.append('description', description);

      await submissionsApi.create(task.id, fd);
      setSuccess('Submission uploaded successfully!');
      setFile(null);
      setDescription('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.friendlyMessage || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(submissionId) {
    try {
      const res = await submissionsApi.getDownloadUrl(submissionId);
      window.open(res.data.data.url, '_blank');
    } catch {
      setError('Could not generate download link');
    }
  }

  const canSubmit = SUBMITTABLE_STATUSES.includes(task.status);
  const latestReview = reviews[0];

  return (
    <Modal title={task.title} onClose={onClose}>
      <div className="space-y-5">
        {/* Task meta */}
        <div className="flex flex-wrap gap-3 pb-3 border-b border-surface-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <span className="text-xs text-ink-muted">Due {formatDate(task.due_date)}</span>
        </div>

        {task.description && (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-ink whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Latest review feedback */}
        {latestReview?.decision === 'revision' && (
          <Alert type="warning">
            <div>
              <p className="font-medium text-sm mb-1">Revision requested by {latestReview.reviewer?.display_name}</p>
              <p className="text-sm">{latestReview.feedback}</p>
            </div>
          </Alert>
        )}

        {/* Submission form */}
        {canSubmit && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-3">Submit Work</p>
            <ErrorAlert message={error} />
            {success && <Alert type="success" className="mb-3">{success}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="form-group">
                <label className="form-label">File *</label>
                <input
                  ref={fileRef}
                  type="file"
                  className="form-input py-1.5 cursor-pointer"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".zip,.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                />
                <span className="form-hint">ZIP, PDF, images, Word documents, text files — max 50 MB</span>
              </div>

              <div className="form-group">
                <label className="form-label">Submission Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Describe what you've completed or any notes for the reviewer…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary btn" disabled={submitting || !file}>
                {submitting ? <Spinner size={14} /> : <Upload size={14} />}
                {task.status === 'revision' ? 'Resubmit Work' : 'Submit for Review'}
              </button>
            </form>
          </div>
        )}

        {/* Submission history */}
        {loading ? <Spinner /> : submissions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-2">
              Submission History ({submissions.length})
            </p>
            <div className="space-y-2">
              {submissions.map((s) => {
                const reviewForSub = reviews.find((r) => r.submission_id === s.id);
                return (
                  <div key={s.id} className="panel px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-ink">Version {s.version_number}</span>
                        <span className="mx-2 text-ink-faint">·</span>
                        <span className="text-xs text-ink-muted">{s.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {reviewForSub && (
                          <span className={`badge ${reviewForSub.decision === 'approved' ? 'badge-approved' : 'badge-revision'}`}>
                            {reviewForSub.decision}
                          </span>
                        )}
                        <button
                          className="btn-ghost btn btn-sm"
                          onClick={() => handleDownload(s.id)}
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">{relativeTime(s.created_at)}</p>
                    {s.description && (
                      <p className="text-xs text-ink-light mt-1 italic">"{s.description}"</p>
                    )}
                    {reviewForSub?.feedback && (
                      <div className="mt-2 pl-3 border-l-2 border-amber-300">
                        <p className="text-xs text-ink-light">{reviewForSub.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
