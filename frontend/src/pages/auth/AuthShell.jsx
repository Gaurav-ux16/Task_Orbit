import { Link } from 'react-router-dom';

/** Two-column sign-in / register layout: a quiet brand panel next to the form. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <Link to="/" className="lp-mark"><i aria-hidden="true" />TaskOrbit</Link>
        <blockquote>Every task in its place, every review on the right version.</blockquote>
        <small>Hashed passwords, server-side sessions and CSRF protection keep each role to its own data.</small>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <h1 className="font-display" style={{ fontSize: 30, letterSpacing: '-0.02em', fontWeight: 400, marginBottom: 4 }}>{title}</h1>
          <p className="text-sm text-ink-muted mb-6">{subtitle}</p>
          {children}
          {footer}
        </div>
      </main>
    </div>
  );
}
