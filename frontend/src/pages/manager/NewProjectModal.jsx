import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { createProject } from '../../features/projects/projectsSlice';
import { profilesApi, projectRequestsApi } from '../../services/taskOrbitApi';
import { Spinner } from '../../components/Spinner';

export function NewProjectModal({ onClose, prefillRequestId = null }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    title: '', description: '', client_id: 'client-001', manager_id: 'manager-001',
    request_id: prefillRequestId || '', start_date: '', due_date: '',
  });
  const [profiles, setProfiles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    profilesApi.list().then((r) => setProfiles(r.data.data || []));
    projectRequestsApi.list({ status: 'pending' }).then((r) => setRequests(r.data.data || []));
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return setError('Title is required');
    setLoading(true); setError('');
    try {
      await dispatch(createProject(form)).unwrap();
      onClose();
    } catch (err) {
      setError(err);
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
          <button className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn" onClick={handleSubmit} disabled={loading}>
            {loading && <Spinner size={14} />} Create Project
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="form-group">
          <label className="form-label">Project Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-input" value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.display_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Manager</label>
            <select className="form-input" value={form.manager_id} onChange={(e) => set('manager_id', e.target.value)}>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="form-group">
            <label className="form-label">Link to Request (optional)</label>
            <select className="form-input" value={form.request_id} onChange={(e) => set('request_id', e.target.value)}>
              <option value="">— None —</option>
              {requests.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </div>
        </div>
      </form>
    </Modal>
  );
}
