import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { FormField } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { usersApi } from '../../services/taskOrbitApi';
import { validateStaffAccount } from '../../utils/validation';
import { useToast } from '../../context/ToastContext';

/** Project-manager-only: provisions an account for staff (or a client). */
export function AddMemberModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ display_name: '', email: '', role: 'assignee', skills: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { notify } = useToast();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateStaffAccount(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    setError('');
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 15);
      const res = await usersApi.create({
        display_name: form.display_name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
        skills,
      });
      notify(`Account created for ${form.display_name.trim()}`);
      onCreated?.(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Could not create the account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add team member"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary btn btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" form="add-member-form" className="btn-primary btn btn-sm" disabled={saving}>
            {saving ? <Spinner size={14} /> : 'Create account'}
          </button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorAlert message={error} />

        <FormField id="am-name" label="Full name" error={errors.display_name} required>
          <input id="am-name" name="display_name" className={`form-input ${errors.display_name ? 'form-input-error' : ''}`}
            value={form.display_name} onChange={handleChange} maxLength={80} />
        </FormField>

        <FormField id="am-email" label="E-mail" error={errors.email} required>
          <input id="am-email" name="email" type="email" className={`form-input ${errors.email ? 'form-input-error' : ''}`}
            value={form.email} onChange={handleChange} maxLength={254} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="am-role" label="Role" error={errors.role} required>
            <select id="am-role" name="role" className="form-input" value={form.role} onChange={handleChange}>
              <option value="assignee">Assignee (developer)</option>
              <option value="reviewer">Reviewer</option>
              <option value="project_manager">Project manager</option>
              <option value="client">Client</option>
            </select>
          </FormField>
          <FormField id="am-skills" label="Skills" error={errors.skills} hint="Comma-separated">
            <input id="am-skills" name="skills" className={`form-input ${errors.skills ? 'form-input-error' : ''}`}
              value={form.skills} onChange={handleChange} maxLength={300} placeholder="React, Node.js" />
          </FormField>
        </div>

        <FormField id="am-password" label="Temporary password" error={errors.password} required
          hint="Share it securely; the member should change it after first sign-in.">
          <input id="am-password" name="password" type="password" autoComplete="new-password"
            className={`form-input ${errors.password ? 'form-input-error' : ''}`}
            value={form.password} onChange={handleChange} maxLength={128} />
        </FormField>
      </form>
    </Modal>
  );
}
