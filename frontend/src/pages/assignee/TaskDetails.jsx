import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  Clock,
  PlayCircle,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  fetchTaskDetails,
  startTask,
  submitDeliverable,
  selectCurrentTaskDetails,
  selectDetailsLoading,
  selectActionSubmitting,
  selectActionError,
  selectActionSuccess,
  clearAssigneeErrors,
  clearAssigneeSuccess,
} from '../../features/assignee/assigneeSlice';
import { TaskStatusBadge } from '../../components/TaskStatusBadge';
import { PriorityBadge } from '../../components/StatusBadge';
import { LoadingState, Spinner } from '../../components/Spinner';
import { ErrorAlert, Alert } from '../../components/Alert';
import { formatDate, relativeTime } from '../../utils/format';
import { SubmissionForm } from './SubmissionForm';
import { submissionsApi, tasksApi } from '../../services/taskOrbitApi';

/**
 * TaskDetails Component
 *
 * Demonstrates:
 * - React Router integration (handles /assignee/tasks/:id route or embedded modal props)
 * - Component Lifecycle (useEffect fetches task data on mount / ID change, handles cleanup)
 * - Redux Toolkit data flow (useDispatch, useSelector, async thunks)
 * - Research-Paper Lifecycle Enforcement:
 *     todo → in_progress → submitted → in_review → approved / revision → in_progress → submitted
 * - Component composition (SubmissionForm, TaskStatusBadge, PriorityBadge)
 *
 * @param {Object} [props]
 * @param {string} [props.taskId] - Optional prop when embedded inside a modal
 * @param {Function} [props.onClose] - Optional close callback when in modal mode
 */
export function TaskDetails({ taskId: propTaskId, onClose }) {
  const { id: routeTaskId } = useParams();
  const effectiveTaskId = propTaskId || routeTaskId;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const details = useSelector(selectCurrentTaskDetails);
  const loading = useSelector(selectDetailsLoading);
  const actionSubmitting = useSelector(selectActionSubmitting);
  const actionError = useSelector(selectActionError);
  const actionSuccess = useSelector(selectActionSuccess);

  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (effectiveTaskId) {
      dispatch(fetchTaskDetails(effectiveTaskId));
    }
    return () => {
      dispatch(clearAssigneeErrors());
      dispatch(clearAssigneeSuccess());
    };
  }, [dispatch, effectiveTaskId]);

  // Transition: todo → in_progress
  async function handleStartTask() {
    await dispatch(startTask(effectiveTaskId));
    dispatch(fetchTaskDetails(effectiveTaskId));
  }

  // Transition: revision → in_progress (Section III-C requirement)
  async function handleResumeWork() {
    try {
      await tasksApi.updateStatus(effectiveTaskId, 'in_progress');
      dispatch(fetchTaskDetails(effectiveTaskId));
    } catch (err) {
      alert(err.friendlyMessage || 'Failed to resume work');
    }
  }

  // Transition: in_progress → submitted
  async function handleSubmitDeliverable(formData) {
    const result = await dispatch(
      submitDeliverable({ taskId: effectiveTaskId, formData })
    );
    if (!result.error) {
      dispatch(fetchTaskDetails(effectiveTaskId));
    }
  }

  async function handleDownload(submissionId) {
    setDownloadingId(submissionId);
    try {
      const res = await submissionsApi.getDownloadUrl(submissionId);
      if (res.data.data?.url) {
        window.open(res.data.data.url, '_blank');
      }
    } catch (err) {
      alert('Failed to download deliverable');
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading && !details) {
    return <LoadingState message="Loading task specifications…" />;
  }

  if (!details?.task) {
    return (
      <div className="page-body">
        <ErrorAlert message="Task not found or unavailable." />
        <Link to="/assignee/tasks" className="btn-secondary btn btn-sm mt-3 inline-flex items-center gap-1">
          <ArrowLeft size={13} /> Back to My Tasks
        </Link>
      </div>
    );
  }

  const { task, submissions = [], reviews = [] } = details;
  const latestReview = reviews[0];
  const canStart = task.status === 'todo';
  const isRevision = task.status === 'revision';
  const canSubmit = task.status === 'in_progress';

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-2">
        <div className="flex items-center gap-3">
          {onClose ? (
            <button type="button" className="btn-secondary btn btn-xs" onClick={onClose}>
              <ArrowLeft size={13} /> Close
            </button>
          ) : (
            <Link to="/assignee/tasks" className="btn-secondary btn btn-xs flex items-center gap-1">
              <ArrowLeft size={13} /> Back to My Tasks
            </Link>
          )}
          <div>
            <h1 className="text-lg font-semibold text-ink leading-tight">{task.title}</h1>
            <p className="text-2xs text-ink-muted mt-0.5">
              Project: <strong>{task.project?.title || 'General Workspace'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {/* Global Alerts */}
      {actionError && <ErrorAlert message={actionError} />}
      {actionSuccess && <Alert type="success">{actionSuccess}</Alert>}

      {/* Reviewer Revision Feedback Banner */}
      {isRevision && latestReview?.feedback && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-800">
            <RotateCcw size={14} className="text-amber-600" />
            <span>Revision Requested by {latestReview.reviewer?.display_name || 'Reviewer'}</span>
          </div>
          <p className="text-amber-900 leading-relaxed pl-5">{latestReview.feedback}</p>
        </div>
      )}

      {/* Task Metadata & Description */}
      <div className="panel p-4 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Task Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-surface-1 p-3 rounded border border-surface-2">
          <div>
            <span className="text-2xs text-ink-muted block uppercase">Start Date</span>
            <span className="font-medium text-ink mt-0.5 block">{formatDate(task.start_date)}</span>
          </div>
          <div>
            <span className="text-2xs text-ink-muted block uppercase">Due Date</span>
            <span className="font-medium text-ink mt-0.5 block">{formatDate(task.due_date)}</span>
          </div>
          <div>
            <span className="text-2xs text-ink-muted block uppercase">Current Phase</span>
            <span className="font-medium text-ink mt-0.5 block capitalize">{task.status.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {task.description ? (
          <div>
            <span className="text-2xs text-ink-muted block uppercase mb-1">Scope & Instructions</span>
            <p className="text-xs text-ink-light leading-relaxed whitespace-pre-wrap">{task.description}</p>
          </div>
        ) : (
          <p className="text-xs text-ink-muted italic">No task description provided.</p>
        )}
      </div>

      {/* Workflow Action 1: Start Task (todo → in_progress) */}
      {canStart && (
        <div className="panel p-4 bg-emerald-50/40 border border-emerald-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-emerald-950">Ready to start this task?</h3>
            <p className="text-2xs text-emerald-800 mt-0.5">
              Advance this task to <strong>"In Progress"</strong> to let your team know development has started.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shrink-0"
            onClick={handleStartTask}
            disabled={actionSubmitting}
          >
            {actionSubmitting ? <Spinner size={13} className="text-white" /> : <PlayCircle size={14} />}
            <span>Start Task</span>
          </button>
        </div>
      )}

      {/* Workflow Action 2: Resume Work on Revision (revision → in_progress) */}
      {isRevision && (
        <div className="panel p-4 bg-amber-50/50 border border-amber-300 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-amber-950">Resume Revision Work</h3>
            <p className="text-2xs text-amber-800 mt-0.5">
              Under the TaskOrbit lifecycle, return this task to <strong>"In Progress"</strong> before submitting the updated deliverable version.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shrink-0"
            onClick={handleResumeWork}
            disabled={actionSubmitting}
          >
            {actionSubmitting ? <Spinner size={13} className="text-white" /> : <PlayCircle size={14} />}
            <span>Resume Work (In Progress)</span>
          </button>
        </div>
      )}

      {/* Workflow Action 3: Submit Work (in_progress → submitted) */}
      {canSubmit && (
        <SubmissionForm
          taskId={task.id}
          isRevision={submissions.length > 0}
          isSubmitting={actionSubmitting}
          onSubmitDeliverable={handleSubmitDeliverable}
        />
      )}

      {task.status === 'submitted' && (
        <div className="panel p-4 bg-blue-50/40 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
          <Clock size={18} className="text-blue-600 shrink-0" />
          <div>
            <p className="font-semibold text-blue-950">Deliverable Under Initial Review</p>
            <p className="text-blue-800 text-2xs mt-0.5">
              Your submission is currently in the review queue awaiting inspector review.
            </p>
          </div>
        </div>
      )}

      {task.status === 'in_review' && (
        <div className="panel p-4 bg-purple-50/40 border border-purple-200 flex items-center gap-3 text-xs text-purple-900">
          <Clock size={18} className="text-purple-600 shrink-0" />
          <div>
            <p className="font-semibold text-purple-950">In Quality Review</p>
            <p className="text-purple-800 text-2xs mt-0.5">
              A designated reviewer is inspecting your submission deliverable against project requirements.
            </p>
          </div>
        </div>
      )}

      {task.status === 'approved' && (
        <div className="panel p-4 bg-emerald-50/50 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-950">Deliverable Approved (Terminal State)</p>
            <p className="text-emerald-800 text-2xs mt-0.5">
              This task has completed all reviews and the deliverable is accepted. No further revisions permitted.
            </p>
          </div>
        </div>
      )}

      {/* Submission History */}
      <div className="panel overflow-hidden">
        <div className="p-3.5 border-b border-surface-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Submission History ({submissions.length})
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="p-6 text-center text-xs text-ink-muted">
            No work deliverables submitted yet.
          </div>
        ) : (
          <div className="divide-y divide-surface-2">
            {submissions.map((sub) => {
              const reviewForSub = reviews.find((r) => r.submission_id === sub.id);
              return (
                <div key={sub.id} className="p-3.5 hover:bg-surface-1/50 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-2 text-ink">
                        v{sub.version_number}
                      </span>
                      <span className="text-xs font-medium text-ink">{sub.file_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {reviewForSub && (
                        <span
                          className={`badge ${
                            reviewForSub.decision === 'approved' ? 'badge-approved' : 'badge-revision'
                          }`}
                        >
                          {reviewForSub.decision}
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn-secondary btn btn-xs flex items-center gap-1"
                        onClick={() => handleDownload(sub.id)}
                        disabled={downloadingId === sub.id}
                      >
                        {downloadingId === sub.id ? <Spinner size={11} /> : <Download size={11} />}
                        Download
                      </button>
                    </div>
                  </div>

                  {sub.description && (
                    <p className="text-xs text-ink-light bg-surface-1 p-2 rounded border border-surface-2">
                      {sub.description}
                    </p>
                  )}

                  <div className="text-2xs text-ink-muted flex items-center gap-3">
                    <span>Submitted {relativeTime(sub.created_at)}</span>
                    {reviewForSub?.feedback && (
                      <span className="text-amber-700 italic">
                        Feedback: "{reviewForSub.feedback}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetails;
