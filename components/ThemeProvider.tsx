'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<Theme>('dark');

  // Force dark mode — light mode temporarily disabled
  useEffect(() => {
    localStorage.removeItem('fa-theme');
    applyTheme('dark');
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  function toggle() {}

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('light', t === 'light');
}

export const useTheme = () => useContext(ThemeCtx);
