import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

const ICONS = { info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle };
const CLASSES = {
  info: 'alert-info',
  warning: 'alert-warning',
  error: 'alert-error',
  success: 'alert-success',
};

export function Alert({ type = 'info', children, className = '' }) {
  const Icon = ICONS[type];
  return (
    <div className={`alert ${CLASSES[type]} ${className}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return <Alert type="error">{message}</Alert>;
}
