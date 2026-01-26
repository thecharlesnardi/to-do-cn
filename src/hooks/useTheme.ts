import { useState, useEffect } from 'react';

const STORAGE_KEY = 'theme';

/**
 * Custom hook for managing dark/light theme
 * - Migrates old multi-theme values to dark/light
 * - Persists preference to localStorage
 */
export function useTheme() {
  // Initialize from localStorage with migration from old theme format
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Migration: sunset/light -> false (light mode), everything else -> true (dark mode)
    if (saved === 'sunset' || saved === 'light') return false;
    return true; // Default to dark mode
  });

  // Apply theme class to body and persist
  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  // Toggle between dark and light
  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, toggleTheme };
}
