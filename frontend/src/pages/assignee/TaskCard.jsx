import { Calendar, PlayCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { TaskStatusBadge } from '../../components/TaskStatusBadge';
import { PriorityBadge } from '../../components/StatusBadge';
import { formatDate, isOverdue } from '../../utils/format';
import { Spinner } from '../../components/Spinner';

/**
 * TaskCard Component
 *
 * Demonstrates:
 * - Components, JSX, and Props (receiving real task data from parent)
 * - Child-to-Parent Communication (invoking onOpen and onStart callbacks)
 * - Semantic HTML (<article>, <header>, <footer>)
 * - Conditional Rendering based on task status and deadline overdue calculations
 *
 * @param {Object} props
 * @param {Object} props.task - Task record from API / Redux store
 * @param {Function} props.onOpen - Parent callback invoked with task.id to open task details
 * @param {Function} [props.onStart] - Parent callback invoked to start a 'todo' task
 * @param {boolean} [props.isStarting] - Whether this specific task is currently transitioning
 */
export function TaskCard({ task, onOpen, onStart, isStarting = false }) {
  const overdue = isOverdue(task.due_date, task.status);
  const canStart = task.status === 'todo';

  return (
    <article
      className={`panel p-4 flex flex-col justify-between transition-all hover:border-accent-light hover:shadow-sm ${
        overdue ? 'border-red-200 bg-red-50/20' : 'bg-white'
      }`}
      data-testid={`task-card-${task.id}`}
    >
      <div>
        {/* Header with badges */}
        <header className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          {overdue && (
            <span className="flex items-center gap-1 text-2xs text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded">
              <AlertTriangle size={11} /> Overdue
            </span>
          )}
        </header>

        {/* Task Title & Project */}
        <h3 className="font-medium text-ink text-sm leading-snug line-clamp-1">{task.title}</h3>
        <p className="text-2xs text-ink-muted mt-0.5 mb-2 truncate">
          Project: {task.project?.title || 'General Workspace'}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-ink-light line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer with dates and actions */}
      <footer className="pt-3 border-t border-surface-2 flex items-center justify-between gap-2 text-2xs">
        <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600 font-medium' : 'text-ink-muted'}`}>
          <Calendar size={12} />
          <span>Due {formatDate(task.due_date)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {canStart && onStart && (
            <button
              type="button"
              className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onStart(task.id);
              }}
              disabled={isStarting}
              title="Start task (advance to in-progress)"
            >
              {isStarting ? <Spinner size={11} className="text-white" /> : <PlayCircle size={11} />}
              Start
            </button>
          )}

          <button
            type="button"
            className="btn-secondary btn btn-xs flex items-center gap-1 text-ink hover:text-accent"
            onClick={() => onOpen(task.id)}
          >
            <span>View</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </footer>
    </article>
  );
}

export default TaskCard;
