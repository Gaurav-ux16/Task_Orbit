import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../../components/Modal';
import { ErrorAlert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import { createProjectRequest } from '../../features/clients/projectRequestsSlice';
import { selectCurrentUser } from '../../app/devIdentitySlice';

export function NewRequestModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    priority: 'medium',
    requested_deadline: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim() || undefined,
        priority: form.priority,
        requested_deadline: form.requested_deadline || undefined,
        client_id: currentUser.id,
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
      <form id="new-request-form" onSubmit={handleSubmit} className="space-y-4">
        <ErrorAlert message={error} />

        <div>
          <label className="label" htmlFor="req-title">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            id="req-title"
            name="title"
            type="text"
            className="input w-full"
            placeholder="e.g. Mobile Customer Portal"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="req-desc">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="req-desc"
            name="description"
            className="input w-full min-h-[70px] text-xs"
            placeholder="Summarize the core goals and business outcome..."
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="req-reqs">
            Key Requirements & Deliverables
          </label>
          <textarea
            id="req-reqs"
            name="requirements"
            className="input w-full min-h-[60px] text-xs"
            placeholder="List specific features, technical constraints, integrations..."
            value={form.requirements}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="req-priority">
              Priority
            </label>
            <select
              id="req-priority"
              name="priority"
              className="select w-full"
              value={form.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="req-deadline">
              Target Deadline
            </label>
            <input
              id="req-deadline"
              name="requested_deadline"
              type="date"
              className="input w-full"
              value={form.requested_deadline}
              onChange={handleChange}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
