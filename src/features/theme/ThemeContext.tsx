import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  surface: string;
  card: string;
  cardBorder: string;
  cardHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryBg: string;
  gold: string;
  goldBg: string;
  goldBorder: string;
  badgeBg: string;
  badgeText: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  headerBorder: string;
}

const DARK_COLORS: ThemeColors = {
  bg: '#030819',
  surface: '#091430',
  card: '#0B1A3F',
  cardBorder: '#1E2D5A',
  cardHover: '#132452',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryBg: 'rgba(37,99,235,0.18)',
  gold: '#FACC15',
  goldBg: 'rgba(250,204,21,0.12)',
  goldBorder: 'rgba(250,204,21,0.35)',
  badgeBg: 'rgba(37,99,235,0.2)',
  badgeText: '#60A5FA',
  danger: '#F87171',
  dangerBg: 'rgba(239,68,68,0.15)',
  success: '#4ADE80',
  successBg: 'rgba(34,197,94,0.15)',
  headerBorder: 'rgba(255,255,255,0.08)',
};

const LIGHT_COLORS: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardHover: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  primary: '#0B25B7',
  primaryHover: '#061D8F',
  primaryBg: 'rgba(11,37,183,0.08)',
  gold: '#D97706',
  goldBg: 'rgba(217,119,6,0.10)',
  goldBorder: 'rgba(217,119,6,0.30)',
  badgeBg: '#EFF6FF',
  badgeText: '#1D4ED8',
  danger: '#DC2626',
  dangerBg: 'rgba(220,38,38,0.10)',
  success: '#16A34A',
  successBg: 'rgba(22,163,74,0.10)',
  headerBorder: '#E2E8F0',
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@app_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  colors: DARK_COLORS,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    // Load persisted theme on mount
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
          try {
            colorScheme.set(saved);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      colorScheme.set(mode);
    } catch {}
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
