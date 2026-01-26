import { Sun, Moon } from '@phosphor-icons/react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

/**
 * Theme toggle button with sun/moon icons
 * Includes subtle glow effect in dark mode
 */
export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-lg
        transition-all duration-200
        cursor-pointer
        ${isDark
          ? 'bg-void-800 border border-void-600 text-void-200 hover:text-ember-500 hover:border-ember-500/50 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]'
          : 'bg-white border border-void-200 text-void-500 hover:text-ember-600 hover:border-ember-500/50'
        }
      `}
    >
      {isDark ? (
        <Sun size={20} weight="bold" />
      ) : (
        <Moon size={20} weight="bold" />
      )}
    </button>
  );
}
