/**
 * Format a date string to a human-readable form.
 * Returns '—' if the date is null/undefined.
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date)) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Return true if a due date is in the past.
 */
export function isOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'approved') return false;
  return new Date(dueDateStr) < new Date();
}

/**
 * Return a CSS class string for a given status badge.
 */
export function statusBadgeClass(status) {
  const map = {
    todo: 'badge-todo',
    in_progress: 'badge-in_progress',
    submitted: 'badge-submitted',
    in_review: 'badge-in_review',
    revision: 'badge-revision',
    approved: 'badge-approved',
    pending: 'badge-pending',
    reviewing: 'badge-reviewing',
    rejected: 'badge-rejected',
    active: 'badge-active',
    completed: 'badge-completed',
    on_hold: 'badge-on_hold',
  };
  return `badge ${map[status] || 'badge-pending'}`;
}

/**
 * Human-readable label for a status value.
 */
export function statusLabel(status) {
  const map = {
    todo: 'To Do',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    in_review: 'In Review',
    revision: 'Revision',
    approved: 'Approved',
    pending: 'Pending',
    reviewing: 'Reviewing',
    rejected: 'Rejected',
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
  };
  return map[status] || status;
}

export function priorityLabel(p) {
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : '—';
}

/**
 * Format bytes to human-readable file size.
 */
export function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Relative time string (e.g. "3 days ago").
 */
export function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}
