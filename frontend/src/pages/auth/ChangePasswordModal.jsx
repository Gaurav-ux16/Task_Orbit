import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { Alert, ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { authApi } from '../../services/taskOrbitApi';
import { validatePassword, collectErrors } from '../../utils/validation';

export function ChangePasswordModal({ onClose }) {
  const user = useSelector(selectCurrentUser);
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = collectErrors({
      current_password: form.current_password ? '' : 'Current password is required',
      new_password: validatePassword(form.new_password, { email: user?.email || '', name: user?.display_name || '' }),
      confirm: form.confirm === form.new_password ? '' : 'Passwords do not match',
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setError('');
    try {
      await authApi.changePassword({ current_password: form.current_password, new_password: form.new_password });
      setDone(true);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Change password"
      onClose={onClose}
      footer={
        done ? (
          <button className="btn-primary btn btn-sm" onClick={onClose}>Close</button>
        ) : (
          <>
            <button type="button" className="btn-secondary btn btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" form="change-password-form" className="btn-primary btn btn-sm" disabled={saving}>
              {saving ? <Spinner size={14} /> : 'Update password'}
            </button>
          </>
        )
      }
    >
      {done ? (
        <Alert type="success">Password updated. Your other sessions were signed out.</Alert>
      ) : (
        <form id="change-password-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <ErrorAlert message={error} />
          <FormField id="cp-current" label="Current password" error={errors.current_password} required>
            <input id="cp-current" name="current_password" type="password" autoComplete="current-password" maxLength={128}
              className="form-input" value={form.current_password} onChange={handleChange} />
          </FormField>
          <FormField id="cp-new" label="New password" error={errors.new_password} required
            hint="At least 10 characters with upper & lower case, a digit and a symbol.">
            <input id="cp-new" name="new_password" type="password" autoComplete="new-password" maxLength={128}
              className="form-input" value={form.new_password} onChange={handleChange} />
          </FormField>
          <FormField id="cp-confirm" label="Confirm new password" error={errors.confirm} required>
            <input id="cp-confirm" name="confirm" type="password" autoComplete="new-password" maxLength={128}
              className="form-input" value={form.confirm} onChange={handleChange} />
          </FormField>
        </form>
      )}
    </Modal>
  );
}
