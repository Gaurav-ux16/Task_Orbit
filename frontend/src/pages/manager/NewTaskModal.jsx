import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Alert, ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { tasksApi, profilesApi } from '../../services/taskOrbitApi';
import { formatDate } from '../../utils/format';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function NewTaskModal({ projectId, onClose, editTask = null }) {
  const [form, setForm] = useState({
    title: editTask?.title || '',
    description: editTask?.description || '',
    assignee_id: editTask?.assignee_id || '',
    priority: editTask?.priority || 'medium',
    start_date: editTask?.start_date || '',
    due_date: editTask?.due_date || '',
  });
  const [profiles, setProfiles] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEffect(() => {
    profilesApi.list({ role: 'assignee' }).then((r) => setProfiles(r.data.data || []));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setConflicts(null);
    setOverrideConfirmed(false);
  }

  async function checkConflicts() {
    if (!form.assignee_id || !form.start_date || !form.due_date) return;
    setConflictLoading(true);
    try {
      const taskId = editTask?.id || 'new';
      const res = await tasksApi.previewConflicts(taskId, {
        assignee_id: form.assignee_id,
        start_date: form.start_date,
        due_date: form.due_date,
      });
      setConflicts(res.data.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Conflict check failed');
    } finally {
      setConflictLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return setError('Title is required');
    if (!form.start_date || !form.due_date) return setError('Start and due dates are required');
    if (new Date(form.start_date) > new Date(form.due_date)) return setError('Start date must be before due date');

    // If conflicts exist and not yet overridden, block
    if (conflicts?.hasConflicts && !overrideConfirmed) {
      return setError('Please acknowledge the scheduling conflict before saving.');
    }

    setSaving(true); setError('');
    try {
      if (editTask) {
        await tasksApi.update(editTask.id, { ...form, override_conflicts: overrideConfirmed });
      } else {
        await tasksApi.create({ ...form, project_id: projectId, override_conflicts: overrideConfirmed });
      }
      onClose();
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editTask ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn" onClick={handleSubmit} disabled={saving}>
            {saving && <Spinner size={14} />}
            {editTask ? 'Save Changes' : 'Create Task'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select className="form-input" value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)}>
              <option value="">— Unassigned —</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input type="date" className="form-input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input type="date" className="form-input" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} required />
          </div>
        </div>

        {/* Conflict preview trigger */}
        {form.assignee_id && form.start_date && form.due_date && (
          <div>
            <button
              type="button"
              className="btn-secondary btn btn-sm"
              onClick={checkConflicts}
              disabled={conflictLoading}
            >
              {conflictLoading && <Spinner size={12} />}
              Check Schedule Conflicts
            </button>
          </div>
        )}

        {/* Conflict results */}
        {conflicts && (
          <div className="conflict-banner">
            <div className="flex items-center gap-2 mb-2">
              {conflicts.hasConflicts ? (
                <AlertTriangle size={16} className="text-amber-600" />
              ) : (
                <CheckCircle size={16} className="text-green-600" />
              )}
              <span className="text-sm font-medium">
                {conflicts.hasConflicts
                  ? `${conflicts.conflicts.length} scheduling conflict${conflicts.conflicts.length > 1 ? 's' : ''} found`
                  : 'No scheduling conflicts'}
              </span>
            </div>

            {conflicts.hasConflicts && (
              <>
                <table className="data-table text-xs mb-3">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Start</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.conflicts.map((c) => (
                      <tr key={c.id} className="bg-amber-50">
                        <td>{c.title}</td>
                        <td>{formatDate(c.start_date)}</td>
                        <td>{formatDate(c.due_date)}</td>
                        <td>{c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <label className="flex items-center gap-2 text-xs text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideConfirmed}
                    onChange={(e) => setOverrideConfirmed(e.target.checked)}
                    className="accent-amber-600"
                  />
                  I acknowledge the conflict and want to proceed anyway
                </label>
              </>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
