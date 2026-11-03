import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Suspense, lazy } from 'react';
import { useDebounce } from './hooks/useDebounce';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StatCard } from './components/StatCard';
import { StatusSummary } from './ssr/StatusSummary';
import { formatFileSize, isOverdue, statusLabel } from './utils/format';
import { isTheme } from './types/models';

afterEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe('Unit V — custom hooks', () => {
  test('useDebounce delays updates until typing stops', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    rerender({ v: 'abc' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(199));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(2));
    expect(result.current).toBe('abc');
  });

  test('useLocalStorage persists, restores and validates stored values', () => {
    const { result, unmount } = renderHook(() => useLocalStorage('k', 'light', isTheme));
    act(() => result.current[1]('dark'));
    expect(JSON.parse(window.localStorage.getItem('k'))).toBe('dark');
    unmount();
    expect(renderHook(() => useLocalStorage('k', 'light', isTheme)).result.current[0]).toBe('dark');

    window.localStorage.setItem('k', JSON.stringify('<script>'));
    expect(renderHook(() => useLocalStorage('k', 'light', isTheme)).result.current[0]).toBe('light');
    window.localStorage.setItem('k', '{not json');
    expect(renderHook(() => useLocalStorage('k', 'light', isTheme)).result.current[0]).toBe('light');
  });
});

describe('Unit V — Context API', () => {
  function Toggle() {
    const { theme, toggle } = useTheme();
    return <button onClick={toggle}>theme:{theme}</button>;
  }

  test('ThemeProvider toggles, persists and sets data-theme on <html>', async () => {
    render(<ThemeProvider><Toggle /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('theme:dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('to_theme')).toBe('"dark"');
  });

  test('ToastProvider shows a toast and auto-dismisses it', async () => {
    function Fire() {
      const { notify } = useToast();
      return <button onClick={() => notify('Saved!', 'success', 50)}>fire</button>;
    }
    render(<ToastProvider><Fire /></ToastProvider>);
    await userEvent.click(screen.getByText('fire'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByText('Saved!')).not.toBeInTheDocument());
  });
});

describe('Unit V — error boundary, memo, lazy loading', () => {
  test('ErrorBoundary contains a crashing child and can recover', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let boom = true;
    const Bomb = () => {
      if (boom) throw new Error('kaboom');
      return <p>recovered</p>;
    };
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    boom = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });

  test('StatCard renders label, value and hint', () => {
    render(<StatCard label="Overdue" value={3} hint="not yet approved" tone="red" />);
    expect(screen.getByTestId('stat-Overdue')).toHaveTextContent('3');
    expect(screen.getByText('not yet approved')).toBeInTheDocument();
  });

  test('React.lazy + Suspense show a fallback then the component', async () => {
    const Lazy = lazy(() => Promise.resolve({ default: () => <p>loaded page</p> }));
    render(<Suspense fallback={<p>loading…</p>}><Lazy /></Suspense>);
    expect(screen.getByText('loading…')).toBeInTheDocument();
    expect(await screen.findByText('loaded page')).toBeInTheDocument();
  });
});

describe('Unit V — server-side rendering', () => {
  const summary = {
    projects: { total: 2, active: 2 },
    tasks: { total: 8, overdue: 3, completion_pct: 13, by_status: { todo: 2, in_progress: 2, approved: 1 } },
  };

  test('renderToString produces complete HTML without a DOM', () => {
    const html = renderToString(<StatusSummary summary={summary} />);
    expect(html).toContain('<section aria-label="Task status summary">');
    expect(html).toContain('in progress');
    expect(html).toContain('13');
  });

  test('server-rendered text is escaped (XSS-safe)', () => {
    const evil = { ...summary, tasks: { ...summary.tasks, by_status: { '<img src=x onerror=alert(1)>': 1 } } };
    const html = renderToString(<StatusSummary summary={evil} />);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });
});

describe('Unit V — TypeScript utilities', () => {
  test('typed format helpers behave', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(null)).toBe('—');
    expect(statusLabel('in_review')).toBe('In Review');
    expect(isOverdue('2000-01-01', 'todo')).toBe(true);
    expect(isOverdue('2000-01-01', 'approved')).toBe(false);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('blue')).toBe(false);
  });
});
