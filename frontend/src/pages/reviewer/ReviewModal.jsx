import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Alert, ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';
import { reviewsApi, submissionsApi, tasksApi } from '../../services/taskOrbitApi';
import { validateReview } from '../../utils/validation';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, RotateCcw, Download, Clock, FileText, AlertTriangle } from 'lucide-react';

export function ReviewModal({ task, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [decision, setDecision] = useState('approved');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [staleError, setStaleError] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const { notify } = useToast();
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    async function loadSubmissions() {
      setLoading(true);
      setError('');
      try {
        const res = await submissionsApi.list(task.id);
        setSubmissions(res.data.data || []);
      } catch (err) {
        setError(err.friendlyMessage || 'Failed to load task submissions');
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, [task.id]);

  const latestSubmission = submissions[0] || task.latest_submission;

  async function handleBeginReview() {
    setStartingReview(true);
    setError('');
    try {
      await tasksApi.updateStatus(task.id, 'in_review');
      setCurrentStatus('in_review');
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to begin review');
    } finally {
      setStartingReview(false);
    }
  }

  async function handleDownload(sub) {
    setDownloadingId(sub.id);
    try {
      const res = await submissionsApi.getDownloadUrl(sub.id);
      if (res.data.data?.url) {
        window.open(res.data.data.url, '_blank');
      } else {
        alert('Download URL not available');
      }
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to get download URL');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    if (!latestSubmission) {
      setError('No submission found to review.');
      return;
    }
    const feedbackErrors = validateReview({ decision, feedback });
    if (feedbackErrors.feedback) {
      setFeedbackError(feedbackErrors.feedback);
      return;
    }

    setSubmitting(true);
    setError('');
    setStaleError('');

    try {
      await reviewsApi.create(latestSubmission.id, {
        task_id: task.id,
        decision,
        feedback: feedback.trim() || undefined,
      });
      notify(decision === 'approved' ? 'Deliverable approved' : 'Revision requested');
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setStaleError(
          err.response.data?.error ||
          'Review conflict: A newer submission version was uploaded while you were reviewing. Please refresh to inspect the latest deliverable.'
        );
      } else {
        setError(err.friendlyMessage || 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Review Deliverable"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <button type="button" className="btn-secondary btn btn-sm" onClick={onClose} disabled={submitting || startingReview}>
            Cancel
          </button>
          {currentStatus === 'submitted' ? (
            <button
              type="button"
              className="btn-primary btn btn-sm flex items-center gap-1.5"
              onClick={handleBeginReview}
              disabled={startingReview || loading}
            >
              {startingReview ? <Spinner size={14} className="text-white" /> : <Clock size={14} />}
              Begin Review (Lock in Review)
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-sm text-white ${decision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
              onClick={handleSubmitReview}
              disabled={submitting || !latestSubmission}
            >
              {submitting ? (
                <Spinner size={14} className="text-white" />
              ) : decision === 'approved' ? (
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Approve Submission</span>
              ) : (
                <span className="flex items-center gap-1.5"><RotateCcw size={14} /> Request Revision</span>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        <ErrorAlert message={error} />

        {staleError && (
          <div className="alert-warning p-3 rounded text-xs flex items-start gap-2 border border-amber-300">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Version Conflict (HTTP 409)</p>
              <p className="text-amber-700 mt-0.5">{staleError}</p>
            </div>
          </div>
        )}

        {/* Task Summary Banner */}
        <div className="panel p-3 bg-surface-1 rounded border border-surface-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-ink text-sm">{task.title}</h2>
              <p className="text-xs text-ink-muted mt-0.5">Project: {task.project?.title || '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-ink-light mt-2 pt-2 border-t border-surface-2">{task.description}</p>
          )}
        </div>

        {/* Deliverable to Review */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">Latest Deliverable</h3>
          {loading ? (
            <div className="py-4 text-center"><Spinner size={18} /></div>
          ) : !latestSubmission ? (
            <p className="text-xs text-ink-muted italic">No submission deliverables recorded.</p>
          ) : (
            <div className="border border-surface-2 rounded-md p-3.5 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-2 text-ink">
                    v{latestSubmission.version_number}
                  </span>
                  <span className="text-xs font-medium text-ink">{latestSubmission.file_name}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn btn-xs flex items-center gap-1.5"
                  onClick={() => handleDownload(latestSubmission)}
                  disabled={downloadingId === latestSubmission.id}
                >
                  {downloadingId === latestSubmission.id ? <Spinner size={12} /> : <Download size={12} />}
                  Download File
                </button>
              </div>

              {latestSubmission.description && (
                <div className="bg-surface-1 p-2.5 rounded text-xs text-ink-light border border-surface-2">
                  <span className="font-medium text-ink block mb-0.5">Assignee Notes:</span>
                  {latestSubmission.description}
                </div>
              )}

              <div className="text-2xs text-ink-muted flex items-center gap-3">
                <span>Submitted by: <strong>{latestSubmission.submitter?.display_name || 'Assignee'}</strong></span>
                <span>•</span>
                <span>{formatDate(latestSubmission.created_at)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Previous Version History (if > 1) */}
        {submissions.length > 1 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">Previous Versions ({submissions.length - 1})</h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {submissions.slice(1).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-3 py-1.5 text-xs bg-surface-1 rounded border border-surface-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs text-ink-muted">v{sub.version_number}</span>
                    <span className="text-ink-muted truncate max-w-xs">{sub.file_name}</span>
                  </div>
                  <button
                    type="button"
                    className="text-accent text-2xs hover:underline flex items-center gap-1"
                    onClick={() => handleDownload(sub)}
                  >
                    <Download size={10} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Decision Form */}
        {currentStatus === 'submitted' ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Clock size={14} className="text-blue-600" />
              Task Awaiting Review Commencement
            </p>
            <p className="text-blue-700">
              In accordance with Section III-C of the research paper, click <strong>"Begin Review"</strong> below to transition the task from <em>submitted</em> to <em>in_review</em> before recording an approval or revision decision.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="space-y-3 pt-2 border-t border-surface-2">
            <div>
              <label className="label">Review Decision</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded border text-xs font-medium transition-all ${
                    decision === 'approved'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-surface-2 bg-surface-1 text-ink-muted hover:bg-surface-2'
                  }`}
                  onClick={() => setDecision('approved')}
                >
                  <CheckCircle2 size={15} className={decision === 'approved' ? 'text-emerald-600' : 'text-ink-muted'} />
                  Approve Deliverable
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded border text-xs font-medium transition-all ${
                    decision === 'revision'
                      ? 'border-amber-600 bg-amber-50 text-amber-800 ring-1 ring-amber-500'
                      : 'border-surface-2 bg-surface-1 text-ink-muted hover:bg-surface-2'
                  }`}
                  onClick={() => setDecision('revision')}
                >
                  <RotateCcw size={15} className={decision === 'revision' ? 'text-amber-600' : 'text-ink-muted'} />
                  Request Revision
                </button>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="review-feedback">
                Feedback & Notes {decision === 'revision' ? <span className="text-red-500">*</span> : <span className="text-ink-muted font-normal">(optional)</span>}
              </label>
              <textarea
                id="review-feedback"
                className="input w-full min-h-[90px] text-xs resize-y"
                placeholder={decision === 'revision' ? 'Explain what changes are needed before this deliverable can be approved…' : 'Add approval remarks or sign-off notes…'}
                value={feedback}
                onChange={(e) => { setFeedback(e.target.value); setFeedbackError(''); }}
                maxLength={2000}
                aria-invalid={Boolean(feedbackError)}
              />
              {feedbackError && <p role="alert" className="text-xs text-red-600 mt-1">{feedbackError}</p>}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
