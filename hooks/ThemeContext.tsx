import React, { createContext, useContext, useState, useEffect } from 'react';
import { useThemeManager } from './useThemeManager';

type ThemeContextType = {
  theme: 'light' | 'dark';
  isThemeReady: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isThemeReady, setIsThemeReady] = useState(false);
  const { setThemePreference, getThemePreference } = useThemeManager();

  useEffect(() => {
    getThemePreference()
      .then((savedTheme) => {
        setTheme(savedTheme);
        setIsThemeReady(true);
      })
      .catch(() => {
        // If there's an error, still mark as ready with default theme
        setIsThemeReady(true);
      });
  }, [getThemePreference]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setThemePreference(newTheme === 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, isThemeReady, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}