import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const colors = {
  light: {
    primary: '#0f766e',      // Deep Calm Teal
    secondary: '#0a8491',    // Calming Soft Blue-Teal
    success: '#10b981',      // Fresh Sage Green
    warning: '#f59e0b',      // Warm Amber
    error: '#ef4444',        // Coral Red
    background: '#f4fbf9',   // Very soft, fresh Mint-tinted background
    surface: '#ffffff',      // Pure White
    text: '#115e59',         // Deep Eucalyptus Dark Teal (calming text)
    textMuted: '#567a77',    // Muted grey-teal
    border: '#d1fae5',       // Softest Mint border
    shadow: '#0d2e2b',
    badgeAdmin: 'rgba(15, 118, 110, 0.1)',
    badgeTeacher: 'rgba(10, 132, 145, 0.1)',
    badgeStudent: 'rgba(16, 185, 129, 0.1)',
    badgeParent: 'rgba(245, 158, 11, 0.1)',
  },
  dark: {
    primary: '#2dd4bf',      // Bright Mint Teal
    secondary: '#38bdf8',    // Calm Sky Blue
    success: '#34d399',      // Soft Sage
    warning: '#fbbf24',      // Soft Amber
    error: '#f87171',        // Soft Coral
    background: '#051f1d',   // Ultra-deep calming Forest/Eucalyptus green (soothing for eyes)
    surface: '#0f2d2a',      // Soft dark-teal card surface
    text: '#f0fdfa',         // Off-white mint tint
    textMuted: '#80a8a4',    // Soft teal-grey
    border: '#114a44',       // Dark forest-teal border
    shadow: '#000000',
    badgeAdmin: 'rgba(45, 212, 191, 0.15)',
    badgeTeacher: 'rgba(56, 189, 248, 0.15)',
    badgeStudent: 'rgba(52, 211, 153, 0.15)',
    badgeParent: 'rgba(251, 191, 36, 0.15)',
  }
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, colors: themeColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
