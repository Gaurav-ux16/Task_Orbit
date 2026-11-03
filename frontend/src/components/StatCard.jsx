import { memo } from 'react';

/** Memoised KPI tile (React.memo avoids re-rendering when props are unchanged). */
export const StatCard = memo(function StatCard({ label, value, hint, tone = 'accent', icon: Icon }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xs uppercase tracking-wide text-ink-muted font-medium">{label}</span>
        {Icon && <Icon size={16} className="stat-icon" />}
      </div>
      <p className="text-2xl font-bold text-ink mt-1" data-testid={`stat-${label}`}>{value}</p>
      {hint && <p className="text-2xs text-ink-muted mt-0.5">{hint}</p>}
    </div>
  );
});
