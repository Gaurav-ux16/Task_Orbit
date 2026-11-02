import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Filter, Layers, Search, PlayCircle } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  fetchAssigneeTasks,
  startTask,
  selectAssigneeTasks,
  selectAssigneeLoading,
  selectAssigneeError,
  clearAssigneeErrors,
} from '../../features/assignee/assigneeSlice';
import { TaskCard } from './TaskCard';
import { TaskDetails } from './TaskDetails';
import { Modal } from '../../components/Modal';
import { LoadingState } from '../../components/Spinner';
import { ErrorAlert } from '../../components/Alert';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'revision', label: 'Revision' },
  { value: 'approved', label: 'Approved' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/**
 * AssigneeDashboard Component
 *
 * Demonstrates:
 * - Components, JSX, and Component Composition (composing TaskCard, Modal, TaskDetails)
 * - State and Props (controlled filter inputs, passing task objects down to TaskCard)
 * - Child-to-Parent Communication (handling onOpen and onStart callbacks)
 * - Lifecycle and Effects (useEffect dispatches fetchAssigneeTasks on mount and filter changes)
 * - Keys and Lists (rendering task cards with stable database task.id keys)
 * - Redux Toolkit & Flux (reading tasks with useSelector, dispatching actions with useDispatch)
 */
export function AssigneeDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const tasks = useSelector(selectAssigneeTasks);
  const loading = useSelector(selectAssigneeLoading);
  const error = useSelector(selectAssigneeError);

  // Local UI Filter States
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [startingTaskId, setStartingTaskId] = useState(null);

  // Fetch tasks for the active assignee
  const loadTasks = useCallback(() => {
    if (currentUser?.id) {
      dispatch(
        fetchAssigneeTasks({
          assigneeId: currentUser.id,
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
        })
      );
    }
  }, [dispatch, currentUser?.id, filterStatus, filterPriority]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle starting a task from 'todo' -> 'in_progress'
  async function handleStartTask(taskId) {
    setStartingTaskId(taskId);
    try {
      await dispatch(startTask(taskId)).unwrap();
      loadTasks();
    } catch (err) {
      // Handled in Redux slice
    } finally {
      setStartingTaskId(null);
    }
  }

  // Handle opening task details
  function handleOpenTask(taskId) {
    setSelectedTaskId(taskId);
  }

  // Client-side search filtering
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(query) ||
      t.project?.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  });

  // Group tasks into logical workflow lanes
  const activeTasks = filteredTasks.filter((t) =>
    ['todo', 'in_progress', 'revision'].includes(t.status)
  );
  const reviewTasks = filteredTasks.filter((t) =>
    ['submitted', 'in_review'].includes(t.status)
  );
  const completedTasks = filteredTasks.filter((t) => t.status === 'approved');

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold text-ink">My Work Packages</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Logged in as <strong>{currentUser?.display_name || 'Developer'}</strong> •{' '}
            {tasks.length} total assigned task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="page-body space-y-5">
        <ErrorAlert message={error} />

        {/* Filter & Search Bar */}
        <div className="panel p-3 bg-surface-1 border border-surface-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-ink-muted" />
            <input
              type="text"
              placeholder="Search assigned tasks by title, scope, or project…"
              className="input w-full text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={13} className="text-ink-muted" />
            <select
              className="select text-xs w-36"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              className="select text-xs w-32"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Lists / Lanes */}
        {loading && tasks.length === 0 ? (
          <LoadingState message="Loading assigned deliverables…" />
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={36} className="mb-3 text-surface-2" />
            <p className="font-medium text-ink">No assigned tasks match your criteria</p>
            <p className="text-sm mt-1">
              {tasks.length === 0
                ? 'Tasks will appear here when a project manager assigns them to you.'
                : 'Try adjusting your filters or search keywords.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Lane */}
            {activeTasks.length > 0 && (
              <section aria-labelledby="active-tasks-title">
                <div className="flex items-center justify-between mb-3">
                  <h2 id="active-tasks-title" className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Active & Revision Required ({activeTasks.length})
                  </h2>
                  <span className="text-2xs text-ink-muted">To Do • In Progress • Revision</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onOpen={handleOpenTask}
                      onStart={handleStartTask}
                      isStarting={startingTaskId === task.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* In Review Lane */}
            {reviewTasks.length > 0 && (
              <section aria-labelledby="review-tasks-title">
                <div className="flex items-center justify-between mb-3">
                  <h2 id="review-tasks-title" className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Awaiting Review ({reviewTasks.length})
                  </h2>
                  <span className="text-2xs text-ink-muted">Submitted • In Review</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reviewTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onOpen={handleOpenTask}
                      onStart={handleStartTask}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Lane */}
            {completedTasks.length > 0 && (
              <section aria-labelledby="completed-tasks-title">
                <div className="flex items-center justify-between mb-3">
                  <h2 id="completed-tasks-title" className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Completed & Approved ({completedTasks.length})
                  </h2>
                  <span className="text-2xs text-ink-muted">Approved by QA</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onOpen={handleOpenTask}
                      onStart={handleStartTask}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Embedded Task Details Modal */}
      {selectedTaskId && (
        <Modal
          title="Task Deliverable Details"
          onClose={() => {
            setSelectedTaskId(null);
            loadTasks();
          }}
        >
          <TaskDetails
            taskId={selectedTaskId}
            onClose={() => {
              setSelectedTaskId(null);
              loadTasks();
            }}
          />
        </Modal>
      )}
    </>
  );
}

export default AssigneeDashboard;
