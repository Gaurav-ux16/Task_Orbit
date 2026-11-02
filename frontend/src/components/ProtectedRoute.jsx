import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectAuthStatus } from '../features/auth/authSlice';
import { Spinner } from './Spinner';

export const ROLE_HOME = {
  project_manager: '/manager/projects',
  assignee: '/assignee/tasks',
  reviewer: '/reviewer/queue',
  client: '/client/requests',
};

/**
 * Route guard.
 *  - not signed in      -> /login (remembering where the user was heading)
 *  - signed in, wrong role -> /forbidden
 * The server enforces the same rules; this only improves the experience.
 */
export function ProtectedRoute({ roles, children }) {
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen" role="status" aria-label="Loading session">
        <Spinner size={24} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}

/** Keeps signed-in users away from /login and /register. */
export function PublicOnlyRoute({ children }) {
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  if (status === 'ready' && user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return children;
}
