import { Loader2 } from 'lucide-react';

export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-accent ${className}`} />;
}

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-ink-muted text-sm">
      <Spinner />
      <span>{message}</span>
    </div>
  );
}
