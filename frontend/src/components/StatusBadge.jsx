import { statusBadgeClass, statusLabel } from '../utils/format';
export { TaskStatusBadge } from './TaskStatusBadge';

export function StatusBadge({ status, className = '' }) {
  return (
    <span className={`${statusBadgeClass(status)} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  return (
    <span className={`badge badge-${priority} ${className}`}>
      {priority || '—'}
    </span>
  );
}
