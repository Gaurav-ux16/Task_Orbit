import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layers, FolderKanban, CheckSquare, FileText, Star, Users, LogOut, KeyRound, Moon, Sun } from 'lucide-react';
import { selectCurrentUser, logout } from '../features/auth/authSlice';
import { useTheme } from '../context/ThemeContext';
import { ChangePasswordModal } from '../pages/auth/ChangePasswordModal';

const ROLE_NAVS = {
  project_manager: [
    { to: '/manager/projects', label: 'Projects', icon: FolderKanban },
    { to: '/manager/tasks', label: 'Task Board', icon: CheckSquare },
    { to: '/manager/workers', label: 'Worker Directory', icon: Users },
    { to: '/manager/requests', label: 'Project Requests', icon: FileText },
  ],
  client: [
    { to: '/client/requests', label: 'My Requests', icon: FileText },
    { to: '/client/projects', label: 'Project Progress', icon: FolderKanban },
  ],
  assignee: [{ to: '/assignee/tasks', label: 'My Tasks', icon: CheckSquare }],
  reviewer: [{ to: '/reviewer/queue', label: 'Review Queue', icon: Star }],
};

const ROLE_LABELS = {
  project_manager: 'Project Manager',
  client: 'Client',
  assignee: 'Assignee',
  reviewer: 'Reviewer',
};

export function AppLayout({ children }) {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggle } = useTheme();

  const navItems = ROLE_NAVS[user?.role] || [];

  async function handleLogout() {
    await dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="px-4 py-4 border-b border-surface-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent" />
            <span className="font-semibold text-ink text-base tracking-tight">TaskOrbit</span>
          </div>
        </div>

        <nav className="flex-1 py-3" aria-label="Main navigation">
          <p className="section-title px-4 mb-1">{ROLE_LABELS[user?.role] || 'Workspace'}</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-2 p-3 space-y-2" data-testid="account-panel">
          <div className="px-1">
            <p className="font-medium text-ink text-xs truncate" title={user?.display_name}>{user?.display_name}</p>
            <p className="text-2xs text-ink-muted">{ROLE_LABELS[user?.role]}</p>
          </div>
          <button className="btn-ghost btn btn-sm w-full justify-start gap-2" onClick={toggle} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="btn-ghost btn btn-sm w-full justify-start gap-2" onClick={() => setShowPassword(true)}>
            <KeyRound size={13} /> Change password
          </button>
          <button className="btn-secondary btn btn-sm w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </div>
  );
}
