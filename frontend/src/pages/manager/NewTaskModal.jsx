import { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { FormField } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { tasksApi, profilesApi } from '../../services/taskOrbitApi';
import { formatDate } from '../../utils/format';
import { validateTask } from '../../utils/validation';
import { AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Create or edit a task.
 *  - editTask: an existing task (must have an id) => PATCH
 *  - defaults: pre-filled values for a NEW task (e.g. assignee chosen in the worker directory)
 *  - projects: when no projectId is given, lets the manager pick the target project
 */
export function NewTaskModal({ projectId: fixedProjectId, projects = [], onClose, editTask = null, defaults = {} }) {
  const initial = editTask || defaults;
  const [projectId, setProjectId] = useState(fixedProjectId || projects[0]?.id || '');
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    assignee_id: initial.assignee_id || '',
    priority: initial.priority || 'medium',
    start_date: initial.start_date || '',
    due_date: initial.due_date || '',
  });
  const [profiles, setProfiles] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEffect(() => {
    profilesApi.list({ role: 'assignee' })
      .then((r) => setProfiles(r.data.data || []))
      .catch((err) => setError(err.friendlyMessage || 'Could not load assignees'));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, range: undefined }));
    setConflicts(null);
    setOverrideConfirmed(false);
  }

  async function checkConflicts() {
    if (!form.assignee_id || !form.start_date || !form.due_date) return;
    const found = validateTask({ ...form, title: form.title || 'placeholder' });
    if (found.start_date || found.due_date || found.range) {
      setErrors(found);
      return;
    }
    setConflictLoading(true);
    try {
      const res = await tasksApi.previewConflicts(editTask?.id || 'new', {
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
    const found = validateTask(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (conflicts?.hasConflicts && !overrideConfirmed) {
      return setError('Please acknowledge the scheduling conflict before saving.');
    }

    if (!editTask?.id && !projectId) {
      setErrors((prev) => ({ ...prev, project: 'Choose a project' }));
      return;
    }

    setSaving(true); setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        start_date: form.start_date,
        due_date: form.due_date,
        ...(form.assignee_id ? { assignee_id: form.assignee_id } : {}),
        override_conflicts: overrideConfirmed,
      };
      if (editTask?.id) {
        await tasksApi.update(editTask.id, payload);
      } else {
        await tasksApi.create({ ...payload, project_id: projectId });
      }
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.hasConflicts) {
        // The server found a conflict the preview had not shown yet: surface it for confirmation.
        setConflicts({ hasConflicts: true, conflicts: data.conflicts });
        setError('Scheduling conflict detected. Review it below and confirm to continue.');
      } else {
        setError(err.friendlyMessage || 'Failed to save task');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editTask?.id ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary btn" onClick={onClose}>Cancel</button>
          <button type="submit" form="task-form" className="btn-primary btn" disabled={saving}>
            {saving && <Spinner size={14} />}
            {editTask?.id ? 'Save Changes' : 'Create Task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorAlert message={error} />
        {errors.range && <ErrorAlert message={errors.range} />}

        {!fixedProjectId && !editTask?.id && (
          <FormField id="task-project" label="Project" error={errors.project} required>
            <select id="task-project" className="form-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">— Select —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </FormField>
        )}

        <FormField id="task-title" label="Title" error={errors.title} required>
          <input id="task-title" className={`form-input ${errors.title ? 'form-input-error' : ''}`} value={form.title}
            maxLength={120} onChange={(e) => set('title', e.target.value)} />
        </FormField>

        <FormField id="task-desc" label="Description" error={errors.description}>
          <textarea id="task-desc" className={`form-input ${errors.description ? 'form-input-error' : ''}`} rows={3}
            maxLength={2000} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="task-priority" label="Priority" error={errors.priority}>
            <select id="task-priority" className="form-input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>
          <FormField id="task-assignee" label="Assignee">
            <select id="task-assignee" className="form-input" value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)}>
              <option value="">— Unassigned —</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="task-start" label="Start Date" error={errors.start_date} required>
            <input id="task-start" type="date" className={`form-input ${errors.start_date ? 'form-input-error' : ''}`}
              value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </FormField>
          <FormField id="task-due" label="Due Date" error={errors.due_date} required>
            <input id="task-due" type="date" className={`form-input ${errors.due_date ? 'form-input-error' : ''}`}
              value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </FormField>
        </div>

        {form.assignee_id && form.start_date && form.due_date && (
          <div>
            <button type="button" className="btn-secondary btn btn-sm" onClick={checkConflicts} disabled={conflictLoading}>
              {conflictLoading && <Spinner size={12} />}
              Check Schedule Conflicts
            </button>
          </div>
        )}

        {conflicts && (
          <div className="conflict-banner" data-testid="conflict-banner">
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
                    <tr><th>Task</th><th>Start</th><th>Due</th><th>Status</th></tr>
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
                  <input type="checkbox" checked={overrideConfirmed} onChange={(e) => setOverrideConfirmed(e.target.checked)} className="accent-amber-600" />
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
