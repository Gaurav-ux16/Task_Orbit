import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers } from 'lucide-react';
import { login, clearAuthError, selectAuthError, selectSessionExpired } from '../../features/auth/authSlice';
import { validateLogin } from '../../utils/validation';
import { FormField } from '../../components/FormField';
import { ErrorAlert, Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { ROLE_HOME } from '../../components/ProtectedRoute';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const serverError = useSelector(selectAuthError);
  const expired = useSelector(selectSessionExpired);

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (serverError || expired) dispatch(clearAuthError());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const result = await dispatch(login({ email: form.email.trim(), password: form.password, remember: form.remember }));
    setSubmitting(false);
    if (login.fulfilled.match(result)) {
      // Return to the page the visitor was heading for — but only if THIS user's role may open it.
      const home = ROLE_HOME[result.payload.user.role] || '/';
      const area = `/${home.split('/')[1]}/`;
      const dest = location.state?.from;
      navigate(typeof dest === 'string' && dest.startsWith(area) ? dest : home, { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 px-4">
      <div className="w-full max-w-sm bg-white border border-surface-2 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={20} className="text-accent" />
          <span className="font-semibold text-ink text-lg tracking-tight">TaskOrbit</span>
        </div>
        <h1 className="text-sm text-ink-muted mb-5">Sign in to your workspace</h1>

        {expired && <Alert type="warning" className="mb-3">Your session expired. Please sign in again.</Alert>}
        <ErrorAlert message={serverError} />

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-3" aria-label="Sign in">
          <FormField id="login-email" label="E-mail" error={errors.email} required>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              maxLength={254}
            />
          </FormField>

          <FormField id="login-password" label="Password" error={errors.password} required>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              maxLength={128}
            />
          </FormField>

          <label className="flex items-center gap-2 text-xs text-ink-light cursor-pointer">
            <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} className="accent-accent" />
            Keep me signed in on this device (30 days)
          </label>

          <button type="submit" className="btn-primary btn w-full justify-center" disabled={submitting}>
            {submitting ? <Spinner size={14} /> : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-ink-muted mt-5 text-center">
          New client? <Link to="/register" className="text-accent hover:underline">Create an account</Link>
        </p>

        {import.meta.env.DEV && (
          <p className="text-2xs text-ink-faint mt-4 text-center">
            Demo (dev only): bob@taskorbit.io · carol@taskorbit.io · eve@taskorbit.io · alice@clientcorp.io — see README.
          </p>
        )}
      </div>
    </div>
  );
}
