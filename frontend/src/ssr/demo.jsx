import { renderToString } from 'react-dom/server';
import { StatusSummary } from './StatusSummary';

// Run with: npm run ssr:demo  — prints server-rendered HTML (Unit V: server-side rendering).
const html = renderToString(
  <StatusSummary
    summary={{
      projects: { total: 2, active: 2 },
      tasks: { total: 8, overdue: 3, completion_pct: 13, by_status: { todo: 2, in_progress: 2, submitted: 1, in_review: 1, revision: 1, approved: 1 } },
    }}
  />
);
console.log(html);
