import { statusBadgeClass, statusLabel } from '../utils/format';

/**
 * TaskStatusBadge Component
 * Demonstrates: Component creation, JSX syntax, props consumption, and conditional styling.
 *
 * @param {Object} props
 * @param {string} props.status - e.g. 'todo', 'in_progress', 'submitted', 'in_review', 'revision', 'approved'
 * @param {string} [props.className] - Optional custom CSS classes
 */
export function TaskStatusBadge({ status, className = '' }) {
  return (
    <span
      className={`${statusBadgeClass(status)} ${className}`}
      data-testid="task-status-badge"
    >
      {statusLabel(status)}
    </span>
  );
}

export default TaskStatusBadge;
