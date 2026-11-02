import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers } from 'lucide-react';
import { register, clearAuthError, selectAuthError } from '../../features/auth/authSlice';
import { validateRegistration, passwordProblems } from '../../utils/validation';
import { FormField } from '../../components/FormField';
import { ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { ROLE_HOME } from '../../components/ProtectedRoute';

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const serverError = useSelector(selectAuthError);

  const [form, setForm] = useState({ display_name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (serverError) dispatch(clearAuthError());
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateRegistration(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    const result = await dispatch(
      register({ display_name: form.display_name.trim(), email: form.email.trim(), password: form.password })
    );
    setSubmitting(false);
    if (register.fulfilled.match(result)) {
      navigate(ROLE_HOME[result.payload.user.role] || '/', { replace: true });
    }
  }

  const missing = form.password ? passwordProblems(form.password, { email: form.email, name: form.display_name }) : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 px-4 py-8">
      <div className="w-full max-w-sm bg-white border border-surface-2 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Layers size={20} className="text-accent" />
          <span className="font-semibold text-ink text-lg tracking-tight">TaskOrbit</span>
        </div>
        <h1 className="text-sm text-ink-muted mb-5">Create a client account</h1>

        <ErrorAlert message={serverError} />

        <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-3" aria-label="Create account">
          <FormField id="reg-name" label="Full name" error={errors.display_name} required>
            <input id="reg-name" name="display_name" type="text" autoComplete="name" maxLength={80}
              className={`form-input ${errors.display_name ? 'form-input-error' : ''}`}
              value={form.display_name} onChange={handleChange} aria-invalid={Boolean(errors.display_name)} />
          </FormField>

          <FormField id="reg-email" label="E-mail" error={errors.email} required>
            <input id="reg-email" name="email" type="email" autoComplete="email" maxLength={254}
              className={`form-input ${errors.email ? 'form-input-error' : ''}`}
              value={form.email} onChange={handleChange} aria-invalid={Boolean(errors.email)} />
          </FormField>

          <FormField
            id="reg-password"
            label="Password"
            error={errors.password}
            hint="At least 10 characters with upper & lower case, a digit and a symbol."
            required
          >
            <input id="reg-password" name="password" type="password" autoComplete="new-password" maxLength={128}
              className={`form-input ${errors.password ? 'form-input-error' : ''}`}
              value={form.password} onChange={handleChange} aria-invalid={Boolean(errors.password)} />
            {form.password && missing.length > 0 && (
              <p className="text-2xs text-amber-700 mt-1">Still needed: {missing.join(', ')}</p>
            )}
          </FormField>

          <FormField id="reg-confirm" label="Confirm password" error={errors.confirm} required>
            <input id="reg-confirm" name="confirm" type="password" autoComplete="new-password" maxLength={128}
              className={`form-input ${errors.confirm ? 'form-input-error' : ''}`}
              value={form.confirm} onChange={handleChange} aria-invalid={Boolean(errors.confirm)} />
          </FormField>

          <button type="submit" className="btn-primary btn w-full justify-center" disabled={submitting}>
            {submitting ? <Spinner size={14} /> : 'Create account'}
          </button>
        </form>

        <p className="text-xs text-ink-muted mt-5 text-center">
          Already registered? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
        <p className="text-2xs text-ink-faint mt-3 text-center">
          Developer, reviewer and manager accounts are created by a project manager.
        </p>
      </div>
    </div>
  );
}
