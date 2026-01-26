import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark/light theme
 * - Detects system preference on first load
 * - Allows manual override via toggle
 * - Persists user preference to localStorage
 */
export function useTheme() {
  // Initialize state from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    // Check if user has a saved preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Otherwise, check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to body element whenever it changes
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle function for the theme button
  const toggleTheme = () => setIsDark(prev => !prev);

  return { isDark, toggleTheme };
}
