import { useState, useRef, useEffect } from 'react';
import { Upload, FileCheck, AlertCircle, X } from 'lucide-react';
import { Spinner } from '../../components/Spinner';

/**
 * SubmissionForm Component
 *
 * Demonstrates:
 * - Controlled React Form Inputs: Local state tracks 'description' and 'file'
 * - Form Validation: Client-side validation ensuring file presence, allowed extensions, and size limits
 * - React Refs (useRef):
 *     1. fileInputRef: Accessing the native file DOM input to validate and reset the file input
 *     2. notesInputRef: Imperatively focusing the submission note textarea upon component mount
 * - Child-to-Parent Communication: Invokes onSubmitDeliverable with FormData payload
 *
 * @param {Object} props
 * @param {string} props.taskId - ID of the task being submitted
 * @param {boolean} props.isRevision - Whether the task was previously returned for revision
 * @param {boolean} props.isSubmitting - Loading indicator from parent / Redux
 * @param {Function} props.onSubmitDeliverable - Callback `(formData) => Promise<void>`
 * @param {Function} [props.onCancel] - Optional cancel callback
 */
export function SubmissionForm({
  taskId,
  isRevision = false,
  isSubmitting = false,
  onSubmitDeliverable,
  onCancel,
}) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // ── Refs ───────────────────────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const notesInputRef = useRef(null);

  // Auto-focus the submission notes textarea on mount
  useEffect(() => {
    if (notesInputRef.current) {
      notesInputRef.current.focus();
    }
  }, []);

  // Allowed file extensions & max size (50MB)
  const ALLOWED_EXTENSIONS = ['zip', 'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt', 'tar', 'gz'];
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0] || null;
    setValidationErrors((prev) => ({ ...prev, file: undefined }));

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationErrors((prev) => ({
        ...prev,
        file: `Invalid file format .${ext}. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setValidationErrors((prev) => ({
        ...prev,
        file: `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 50 MB limit.`,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
  }

  function handleRemoveFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};

    if (!file) {
      errors.file = 'Please attach a deliverable file to submit.';
    }

    if (isRevision && !description.trim()) {
      errors.description = 'Please include a note explaining the revisions made.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    await onSubmitDeliverable(formData);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel p-4 bg-surface-1 border border-surface-2 rounded space-y-4"
      data-testid="submission-form"
    >
      <div className="flex items-center justify-between border-b border-surface-2 pb-2">
        <div>
          <h4 className="text-xs font-semibold text-ink uppercase tracking-wide">
            {isRevision ? 'Resubmit Deliverable (Revision)' : 'Submit Work for Review'}
          </h4>
          <p className="text-2xs text-ink-muted mt-0.5">
            Attach your work file. Once submitted, the task status advances to "submitted" for reviewer inspection.
          </p>
        </div>
      </div>

      {/* File Upload Section */}
      <div>
        <label className="label" htmlFor="deliverable-file">
          Deliverable Attachment <span className="text-red-500">*</span>
        </label>

        {!file ? (
          <div className="mt-1">
            <input
              id="deliverable-file"
              ref={fileInputRef}
              type="file"
              className="input w-full text-xs cursor-pointer py-1.5"
              onChange={handleFileChange}
              accept=".zip,.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.tar,.gz"
            />
            <span className="text-2xs text-ink-muted mt-1 block">
              Accepted formats: ZIP, PDF, PNG, JPG, DOCX, TXT (Max 50 MB)
            </span>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between p-2.5 bg-white border border-surface-2 rounded text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileCheck size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium text-ink truncate">{file.name}</span>
              <span className="text-2xs text-ink-muted shrink-0">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost btn btn-xs text-red-600 hover:text-red-700"
              onClick={handleRemoveFile}
              title="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {validationErrors.file && (
          <p className="text-2xs text-red-600 flex items-center gap-1 mt-1.5">
            <AlertCircle size={12} /> {validationErrors.file}
          </p>
        )}
      </div>

      {/* Submission Notes */}
      <div>
        <label className="label" htmlFor="submission-notes">
          Submission Notes {isRevision ? <span className="text-red-500">*</span> : <span className="text-ink-muted font-normal">(optional)</span>}
        </label>
        <textarea
          id="submission-notes"
          ref={notesInputRef}
          className="input w-full min-h-[75px] text-xs resize-y"
          placeholder={
            isRevision
              ? 'Detail how you resolved the reviewer feedback…'
              : 'Summarize the deliverable, build instructions, or implementation details…'
          }
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (validationErrors.description) {
              setValidationErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
        />
        {validationErrors.description && (
          <p className="text-2xs text-red-600 flex items-center gap-1 mt-1">
            <AlertCircle size={12} /> {validationErrors.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="btn-secondary btn btn-xs"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary btn btn-xs flex items-center gap-1.5"
          disabled={isSubmitting || !file}
        >
          {isSubmitting ? (
            <Spinner size={12} className="text-white" />
          ) : (
            <Upload size={12} />
          )}
          <span>{isRevision ? 'Resubmit Work' : 'Submit for Review'}</span>
        </button>
      </div>
    </form>
  );
}

export default SubmissionForm;
