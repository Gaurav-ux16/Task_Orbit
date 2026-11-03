import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isTheme } from '../types/models';

const ThemeContext = createContext({ theme: 'light', toggle: () => {} });

/** Context API: light / dark theme, persisted and applied as <html data-theme>. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('to_theme', 'light', isTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(
    () => ({ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }),
    [theme, setTheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
