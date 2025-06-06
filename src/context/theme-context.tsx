
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light'); // Default to light initially

  const applyTheme = useCallback((selectedTheme: Theme) => {
    const root = window.document.documentElement;
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', selectedTheme);
  }, []);

  useEffect(() => {
    // Try to get the theme from localStorage
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    let initialTheme: Theme;
    if (storedTheme) {
      initialTheme = storedTheme; // Use stored theme if available
    } else {
      initialTheme = 'light'; // Otherwise, default to light mode
    }
    
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      return newTheme;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
