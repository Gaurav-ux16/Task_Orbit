import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { FormField } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { createProjectRequest } from '../../features/clients/projectRequestsSlice';
import { validateProjectRequest } from '../../utils/validation';

export function NewRequestModal({ onClose, onCreated }) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    priority: 'medium',
    requested_deadline: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate & screen every textbox BEFORE anything is sent / saved.
    const found = validateProjectRequest(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim() || undefined,
        priority: form.priority,
        requested_deadline: form.requested_deadline,
      };

      const result = await dispatch(createProjectRequest(payload)).unwrap();
      onCreated?.(result);
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Submit New Project Request"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary btn btn-sm" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="new-request-form" className="btn-primary btn btn-sm" disabled={submitting}>
            {submitting ? <Spinner size={14} /> : 'Submit Request'}
          </button>
        </div>
      }
    >
      <form id="new-request-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorAlert message={error} />

        <FormField id="req-title" label="Project Title" error={errors.title} required>
          <input
            id="req-title"
            name="title"
            type="text"
            className={`form-input ${errors.title ? 'form-input-error' : ''}`}
            placeholder="e.g. Mobile Customer Portal"
            value={form.title}
            onChange={handleChange}
            maxLength={120}
            aria-invalid={Boolean(errors.title)}
          />
        </FormField>

        <FormField id="req-desc" label="Project Description" error={errors.description} required>
          <textarea
            id="req-desc"
            name="description"
            className={`form-input min-h-[70px] text-xs ${errors.description ? 'form-input-error' : ''}`}
            placeholder="Summarize the core goals and business outcome..."
            value={form.description}
            onChange={handleChange}
            maxLength={2000}
            aria-invalid={Boolean(errors.description)}
          />
        </FormField>

        <FormField id="req-reqs" label="Key Requirements & Deliverables" error={errors.requirements}>
          <textarea
            id="req-reqs"
            name="requirements"
            className={`form-input min-h-[60px] text-xs ${errors.requirements ? 'form-input-error' : ''}`}
            placeholder="List specific features, technical constraints, integrations..."
            value={form.requirements}
            onChange={handleChange}
            maxLength={2000}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField id="req-priority" label="Priority" error={errors.priority}>
            <select id="req-priority" name="priority" className="form-input" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </FormField>

          <FormField id="req-deadline" label="Target Deadline" error={errors.requested_deadline} required>
            <input
              id="req-deadline"
              name="requested_deadline"
              type="date"
              className={`form-input ${errors.requested_deadline ? 'form-input-error' : ''}`}
              value={form.requested_deadline}
              onChange={handleChange}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
