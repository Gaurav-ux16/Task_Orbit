import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { ROLE_HOME } from '../../components/ProtectedRoute';

const STEPS = [
  ['01', 'Request', 'A client describes the work and the date it is needed. Nothing starts until a manager accepts it.'],
  ['02', 'Plan', 'The manager creates tasks and assigns people. Overlapping schedules are flagged before anything is saved.'],
  ['03', 'Deliver', 'The assignee starts the task and uploads a file. Every upload becomes a numbered version.'],
  ['04', 'Review', 'A reviewer inspects the latest version only. Older versions cannot be approved by mistake.'],
  ['05', 'Approve', 'Approved is final. If changes are needed, the task goes back to the assignee and the loop repeats.'],
];

const ROLES = [
  ['Client', 'Files requests, follows progress on their own projects, and receives deliverables once they are approved.'],
  ['Project manager', 'Plans projects, assigns tasks, resolves scheduling conflicts and sees the whole portfolio.'],
  ['Assignee', 'Sees only their own tasks, works through them in order and submits versioned deliverables.'],
  ['Reviewer', 'Works a queue of submitted work, records a decision, and leaves feedback the assignee can act on.'],
];

export function LandingPage() {
  const user = useSelector(selectCurrentUser);
  const home = user ? ROLE_HOME[user.role] || '/' : null;

  return (
    <div className="lp">
      <header className="lp-wrap lp-nav">
        <Link to="/" className="lp-mark"><i aria-hidden="true" />TaskOrbit</Link>
        <nav className="lp-links" aria-label="Sections">
          <a href="#path">How it works</a>
          <a href="#roles">Roles</a>
          <a href="#rules">Safeguards</a>
        </nav>
        <div className="lp-actions">
          {home ? (
            <Link className="lp-btn" to={home}>Open workspace <ArrowRight size={15} /></Link>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="lp-btn" to="/register">Get started</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="lp-wrap lp-hero">
          <div>
            <span className="lp-eyebrow">Project delivery, with rules</span>
            <h1 className="lp-h1">Work moves in order, <em>or it does not move.</em></h1>
            <p className="lp-lede">
              TaskOrbit is a workspace for teams and the clients they build for. Every task follows one fixed path —
              assigned, delivered, reviewed, approved — and the system will not let anyone skip a step or review the wrong version.
            </p>
            <div className="lp-cta">
              {home ? (
                <Link className="lp-btn" to={home}>Open workspace <ArrowRight size={15} /></Link>
              ) : (
                <>
                  <Link className="lp-btn" to="/register">Create a client account</Link>
                  <Link className="lp-btn ghost" to="/login">Sign in</Link>
                </>
              )}
            </div>
            <p className="lp-note">Developers, reviewers and managers are invited by a project manager.</p>
          </div>

          <div className="lp-board" aria-hidden="true">
            <div className="lp-sheet">
              <div className="lp-row">
                <span className="lp-meta">E-Commerce Platform Redesign</span>
                <span className="lp-chip go">In review</span>
              </div>
              <div className="lp-title">Payment gateway integration</div>
              <div className="lp-meta">Version 2 · due 5 Nov · assigned to Carol Singh</div>
              <div className="lp-track">
                <span className="lp-dot on" /><span className="lp-line on" />
                <span className="lp-dot on" /><span className="lp-line on" />
                <span className="lp-dot on" /><span className="lp-line on" />
                <span className="lp-dot on" /><span className="lp-line" />
                <span className="lp-dot" />
              </div>
              <div className="lp-track-labels">
                <span>To do</span><span>In progress</span><span>Submitted</span><span>In review</span><span>Approved</span>
              </div>
            </div>
            <div className="lp-sheet">
              <div className="lp-row">
                <span className="lp-chip warn">Schedule conflict</span>
                <span className="lp-meta">Checked before saving</span>
              </div>
              <div className="lp-title">Overlaps with “Product listing page”</div>
              <div className="lp-meta">10 – 25 Oct · same assignee · confirm to continue</div>
            </div>
          </div>
        </section>

        <section id="path" className="lp-section">
          <div className="lp-wrap">
            <span className="lp-eyebrow">How it works</span>
            <h2>One path, five stops.</h2>
            <div className="lp-steps">
              {STEPS.map(([n, title, text]) => (
                <div className="lp-step" key={n}>
                  <b>{n}</b>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="lp-section">
          <div className="lp-wrap lp-split">
            <div>
              <span className="lp-eyebrow">Roles</span>
              <h2>Everyone sees what they need, and nothing more.</h2>
            </div>
            <dl className="lp-list" style={{ margin: 0 }}>
              {ROLES.map(([role, text]) => (
                <div key={role}>
                  <dt>{role}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="rules" className="lp-section">
          <div className="lp-wrap lp-split">
            <div>
              <span className="lp-eyebrow">Safeguards</span>
              <h2>The rules live on the server, not in a settings page.</h2>
            </div>
            <dl className="lp-list" style={{ margin: 0 }}>
              <div><dt>Ordered states</dt><dd>Only six task states and six legal moves between them. Anything else is refused.</dd></div>
              <div><dt>Latest version</dt><dd>A review must name the most recent submission. A stale review is rejected, not merged.</dd></div>
              <div><dt>Schedule checks</dt><dd>Two open tasks for one person on overlapping days are flagged, and the manager must confirm.</dd></div>
              <div><dt>Account security</dt><dd>Hashed passwords, server-side sessions, CSRF protection, and every text field screened before it is stored.</dd></div>
            </dl>
          </div>
          <div className="lp-wrap lp-facts">
            <div className="lp-fact"><b>6</b><span>task states with a fixed order</span></div>
            <div className="lp-fact"><b>4</b><span>roles, each with its own view of the data</span></div>
            <div className="lp-fact"><b>438</b><span>automated tests covering the rules above</span></div>
          </div>
        </section>

        <section className="lp-band">
          <div className="lp-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <h2>Ready to run a project the orderly way?</h2>
            <div className="lp-cta" style={{ marginTop: 0 }}>
              {home ? (
                <Link className="lp-btn" to={home}>Open workspace</Link>
              ) : (
                <>
                  <Link className="lp-btn" to="/register">Create a client account</Link>
                  <Link className="lp-btn ghost" to="/login">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-wrap lp-foot">
        <span>TaskOrbit — a workflow-aware project management system.</span>
        <span>Vishwakarma Institute of Technology · Web Technology project</span>
      </footer>
    </div>
  );
}
