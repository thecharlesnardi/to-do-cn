import { useState, useEffect } from 'react';

/**
 * Available theme names
 */
export type ThemeName = 'ember' | 'forest' | 'ocean' | 'sunset';

/**
 * Theme configuration with colors
 */
export interface ThemeConfig {
  id: ThemeName;
  name: string;
  isDark: boolean;
  // Preview colors for the theme picker
  previewBg: string;
  previewAccent: string;
}

/**
 * Available themes configuration
 */
export const THEMES: ThemeConfig[] = [
  {
    id: 'ember',
    name: 'Ember',
    isDark: true,
    previewBg: '#0a0a0a',
    previewAccent: '#f59e0b',
  },
  {
    id: 'forest',
    name: 'Forest',
    isDark: true,
    previewBg: '#1a2f1a',
    previewAccent: '#4ade80',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    isDark: true,
    previewBg: '#1a2a3a',
    previewAccent: '#3d7ea6',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    isDark: false,
    previewBg: '#fff5f0',
    previewAccent: '#e07050',
  },
];

const STORAGE_KEY = 'theme';

/**
 * Custom hook for managing theme selection
 * - Supports multiple color themes: Ember, Forest, Ocean, Sunset
 * - Persists user preference to localStorage
 * - Returns current theme info and setter
 */
export function useTheme() {
  // Initialize theme from localStorage or default to ember
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.some(t => t.id === saved)) {
      return saved as ThemeName;
    }
    // Check if old theme format (dark/light) exists
    if (saved === 'dark') return 'ember';
    if (saved === 'light') return 'sunset';
    // Default to ember (dark mode)
    return 'ember';
  });

  const theme = THEMES.find(t => t.id === themeName) || THEMES[0];

  // Apply theme to body element whenever it changes
  useEffect(() => {
    // Remove all theme classes
    THEMES.forEach(t => {
      document.body.classList.remove(`theme-${t.id}`);
    });

    // Add current theme class
    document.body.classList.add(`theme-${themeName}`);

    // Toggle dark class based on theme
    if (theme.isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, themeName);
  }, [themeName, theme.isDark]);

  // Change theme
  const setTheme = (name: ThemeName) => {
    setThemeName(name);
  };

  // For backwards compatibility
  const isDark = theme.isDark;
  const toggleTheme = () => {
    // Cycle through themes
    const currentIndex = THEMES.findIndex(t => t.id === themeName);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setThemeName(THEMES[nextIndex].id);
  };

  return {
    theme,
    themeName,
    setTheme,
    themes: THEMES,
    // Backwards compatibility
    isDark,
    toggleTheme,
  };
}
