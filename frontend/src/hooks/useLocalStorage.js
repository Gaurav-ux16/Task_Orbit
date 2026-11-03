import { useCallback, useState } from 'react';

/**
 * useState that persists to localStorage. Only for NON-sensitive preferences
 * (theme, filters) — never tokens or personal data.
 */
export function useLocalStorage(key, initial, validate = () => true) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      return validate(parsed) ? parsed : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage full / disabled: keep the in-memory value */
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}
