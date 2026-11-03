import { Component } from 'react';

/** Class-based error boundary: a crash in one page never blanks the whole app. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[UI error]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="text-sm text-ink-muted mt-1 max-w-sm">An unexpected error occurred while showing this page.</p>
        <button className="btn-primary btn mt-5" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}
