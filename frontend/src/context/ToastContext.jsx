import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext({ notify: () => {} });
const ICONS = { success: CheckCircle, error: XCircle, info: Info };

/** Lightweight toast notifications (replaces blocking alert() calls). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (message, type = 'success', ms = 3500) => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, message, type }]);
      if (ms > 0) setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <Icon size={16} className="shrink-0" />
              <span>{t.message}</span>
              <button type="button" aria-label="Dismiss" className="ml-2 opacity-60 hover:opacity-100" onClick={() => dismiss(t.id)}>×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
