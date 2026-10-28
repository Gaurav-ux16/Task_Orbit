import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn-secondary btn" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? 'btn-danger btn' : 'btn-primary btn'}
            onClick={onConfirm}
          >
            Confirm
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {danger && <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />}
        <p className="text-sm text-ink-light">{message}</p>
      </div>
    </Modal>
  );
}
