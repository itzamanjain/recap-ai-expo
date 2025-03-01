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
    const THEME_LOAD_TIMEOUT = 3000; // 3 seconds timeout
    
    const timeoutId = setTimeout(() => {
      // If theme loading takes too long, fallback to default
      console.warn('Theme loading timed out, falling back to default theme');
      setIsThemeReady(true);
    }, THEME_LOAD_TIMEOUT);

    const loadTheme = async () => {
      try {
        const savedTheme = await Promise.race([
          getThemePreference(),
          new Promise<'light' | 'dark'>((_, reject) =>
            setTimeout(() => reject(new Error('Theme loading timeout')), THEME_LOAD_TIMEOUT)
          )
        ]);
        setTheme(savedTheme);
      } catch (error) {
        console.warn('Error loading theme:', error);
        // Keep default theme
      } finally {
        setIsThemeReady(true);
        clearTimeout(timeoutId);
      }
    };

    loadTheme();

    return () => clearTimeout(timeoutId);
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