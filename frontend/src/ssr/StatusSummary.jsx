/** Pure presentational component: safe to render on the server with renderToString. */
export function StatusSummary({ summary }) {
  const rows = Object.entries(summary.tasks.by_status);
  return (
    <section aria-label="Task status summary">
      <h2>{summary.projects.active} active of {summary.projects.total} projects</h2>
      <ul>
        {rows.map(([status, count]) => (
          <li key={status}>{status.replace('_', ' ')}: {count}</li>
        ))}
      </ul>
      <p>{summary.tasks.completion_pct}% complete &middot; {summary.tasks.overdue} overdue</p>
    </section>
  );
}
