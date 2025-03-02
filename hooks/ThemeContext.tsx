import React, { createContext, useContext } from 'react';

type ThemeContextType = {
  theme: 'light';
  isThemeReady: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use light theme
  const theme = 'light';
  const isThemeReady = true;

  return (
    <ThemeContext.Provider value={{ theme, isThemeReady }}>
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