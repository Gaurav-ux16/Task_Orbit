import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert } from 'lucide-react';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { ROLE_HOME } from '../../components/ProtectedRoute';

export function ForbiddenPage() {
  const user = useSelector(selectCurrentUser);
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldAlert size={36} className="text-amber-500 mb-3" />
      <h1 className="text-lg font-semibold text-ink">Access denied</h1>
      <p className="text-sm text-ink-muted mt-1 max-w-sm">
        Your role does not have permission to view this page.
      </p>
      <Link className="btn-primary btn mt-5" to={ROLE_HOME[user?.role] || '/'}>Back to my workspace</Link>
    </div>
  );
}
