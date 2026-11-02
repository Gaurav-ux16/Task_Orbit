/**
 * Accessible labelled field with an inline validation message.
 * `children` is the input element; give it the same `id`.
 */
export function FormField({ id, label, error, hint, required = false, children }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-2xs text-ink-muted mt-1">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
