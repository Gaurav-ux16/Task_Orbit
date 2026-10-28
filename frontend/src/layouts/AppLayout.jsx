import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Layers, FolderKanban, CheckSquare, FileText, Star, Users,
  ChevronDown, AlertCircle
} from 'lucide-react';
import { selectCurrentUser, selectAllProfiles, switchUser } from '../app/devIdentitySlice';
import { useState } from 'react';

const ROLE_NAVS = {
  project_manager: [
    { to: '/manager/projects',  label: 'Projects',           icon: FolderKanban },
    { to: '/manager/tasks',     label: 'Task Board',         icon: CheckSquare },
    { to: '/manager/workers',   label: 'Worker Directory',   icon: Users },
    { to: '/manager/requests',  label: 'Project Requests',   icon: FileText },
  ],
  client: [
    { to: '/client/requests',   label: 'My Requests',        icon: FileText },
    { to: '/client/projects',   label: 'Project Progress',   icon: FolderKanban },
  ],
  assignee: [
    { to: '/assignee/tasks',    label: 'My Tasks',           icon: CheckSquare },
  ],
  reviewer: [
    { to: '/reviewer/queue',    label: 'Review Queue',       icon: Star },
  ],
};

const ROLE_LABELS = {
  project_manager: 'Project Manager',
  client: 'Client',
  assignee: 'Assignee',
  reviewer: 'Reviewer',
};

export function AppLayout({ children }) {
  const user = useSelector(selectCurrentUser);
  const profiles = useSelector(selectAllProfiles);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const navItems = ROLE_NAVS[user.role] || [];

  function handleSwitch(profileId) {
    dispatch(switchUser(profileId));
    setShowSwitcher(false);
    navigate('/');
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Wordmark */}
        <div className="px-4 py-4 border-b border-surface-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent" />
            <span className="font-semibold text-ink text-base tracking-tight">TaskOrbit</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3" aria-label="Main navigation">
          <p className="section-title px-4 mb-1">{ROLE_LABELS[user.role] || 'Workspace'}</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Dev identity switcher */}
        <div className="border-t border-surface-2 p-3 relative">
          {/* DEV NOTICE */}
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <AlertCircle size={11} className="text-amber-500 shrink-0" />
            <span className="text-2xs text-amber-600 font-medium">Dev mode — no auth</span>
          </div>

          <button
            className="w-full flex items-center justify-between px-3 py-2 rounded border border-surface-2 bg-surface-1 hover:bg-surface-2 transition-colors text-sm"
            onClick={() => setShowSwitcher((v) => !v)}
            aria-expanded={showSwitcher}
          >
            <div className="flex flex-col items-start min-w-0">
              <span className="font-medium text-ink text-xs truncate">{user.display_name}</span>
              <span className="text-2xs text-ink-muted">{ROLE_LABELS[user.role]}</span>
            </div>
            <ChevronDown size={14} className={`text-ink-muted transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
          </button>

          {showSwitcher && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-surface-2 rounded-md shadow-md z-20 py-1">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-1 transition-colors
                    ${p.id === user.id ? 'bg-accent-subtle text-accent' : 'text-ink'}`}
                  onClick={() => handleSwitch(p.id)}
                >
                  <div className="font-medium">{p.display_name}</div>
                  <div className="text-2xs text-ink-muted">{ROLE_LABELS[p.role]}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
