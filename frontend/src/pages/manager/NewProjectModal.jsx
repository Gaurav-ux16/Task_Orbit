import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { FormField } from '../../components/FormField';
import { createProject } from '../../features/projects/projectsSlice';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { profilesApi, projectRequestsApi } from '../../services/taskOrbitApi';
import { Spinner } from '../../components/Spinner';
import { validateProject } from '../../utils/validation';

export function NewProjectModal({ onClose, prefillRequestId = null }) {
  const dispatch = useDispatch();
  const me = useSelector(selectCurrentUser);
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', manager_id: me?.id || '',
    request_id: prefillRequestId || '', start_date: '', due_date: '',
  });
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profilesApi.list().then((r) => {
      const list = r.data.data || [];
      setProfiles(list);
      setForm((f) => (f.client_id ? f : { ...f, client_id: list.find((p) => p.role === 'client')?.id || '' }));
    }).catch((err) => setError(err.friendlyMessage || 'Could not load people'));
    projectRequestsApi.list({ status: 'pending' }).then((r) => setRequests(r.data.data || [])).catch(() => {});
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, range: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateProject(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true); setError('');
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
      await dispatch(createProject(payload)).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  const clients = profiles.filter((p) => p.role === 'client');
  const managers = profiles.filter((p) => p.role === 'project_manager');

  return (
    <Modal
      title="New Project"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="new-project-form" className="btn-primary btn" disabled={loading}>
            {loading && <Spinner size={14} />} Create Project
          </button>
        </>
      }
    >
      <form id="new-project-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorAlert message={error} />
        {errors.range && <ErrorAlert message={errors.range} />}

        <FormField id="proj-title" label="Project Title" error={errors.title} required>
          <input id="proj-title" className={`form-input ${errors.title ? 'form-input-error' : ''}`} value={form.title}
            maxLength={120} onChange={(e) => set('title', e.target.value)} />
        </FormField>

        <FormField id="proj-desc" label="Description" error={errors.description}>
          <textarea id="proj-desc" className={`form-input ${errors.description ? 'form-input-error' : ''}`} rows={3}
            maxLength={2000} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="proj-client" label="Client" error={errors.client_id} required>
            <select id="proj-client" className="form-input" value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">— Select —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </FormField>
          <FormField id="proj-manager" label="Manager">
            <select id="proj-manager" className="form-input" value={form.manager_id} onChange={(e) => set('manager_id', e.target.value)}>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </FormField>
        </div>

        {requests.length > 0 && (
          <FormField id="proj-request" label="Link to Request (optional)">
            <select id="proj-request" className="form-input" value={form.request_id} onChange={(e) => {
              set('request_id', e.target.value);
              const linked = requests.find((r) => r.id === e.target.value);
              if (linked) set('client_id', linked.client_id);
            }}>
              <option value="">— None —</option>
              {requests.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField id="proj-start" label="Start Date" error={errors.start_date}>
            <input id="proj-start" type="date" className="form-input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </FormField>
          <FormField id="proj-due" label="Due Date" error={errors.due_date}>
            <input id="proj-due" type="date" className="form-input" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
