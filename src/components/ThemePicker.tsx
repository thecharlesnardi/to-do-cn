import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from '@phosphor-icons/react';
import type { ThemeName, ThemeConfig } from '../hooks/useTheme';

interface ThemePickerProps {
  currentTheme: ThemeName;
  themes: ThemeConfig[];
  onThemeChange: (theme: ThemeName) => void;
  isDark: boolean;
}

/**
 * Theme picker dropdown component
 * Shows color swatches for each available theme
 */
export function ThemePicker({ currentTheme, themes, onThemeChange, isDark }: ThemePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currentThemeConfig = themes.find(t => t.id === currentTheme);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change theme"
        aria-expanded={isOpen}
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
        <Palette size={20} weight="bold" />
        {/* Current theme indicator dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
          style={{
            backgroundColor: currentThemeConfig?.previewAccent,
            borderColor: isDark ? '#0a0a0a' : '#ffffff',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`
            absolute right-0 top-full mt-2 p-2
            rounded-lg shadow-lg border
            z-50 min-w-[140px]
            theme-picker-enter
            ${isDark
              ? 'bg-void-800 border-void-700'
              : 'bg-white border-void-200'
            }
          `}
        >
          <div className="space-y-1">
            {themes.map((themeOption) => {
              const isSelected = themeOption.id === currentTheme;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    onThemeChange(themeOption.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-md
                    transition-all duration-150 cursor-pointer
                    ${isSelected
                      ? isDark
                        ? 'bg-void-700'
                        : 'bg-void-100'
                      : isDark
                        ? 'hover:bg-void-700/50'
                        : 'hover:bg-void-50'
                    }
                  `}
                >
                  {/* Color swatch */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: themeOption.previewBg,
                      borderColor: themeOption.previewAccent,
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        weight="bold"
                        style={{ color: themeOption.previewAccent }}
                      />
                    )}
                  </div>

                  {/* Theme name */}
                  <span
                    className={`
                      text-sm font-medium
                      ${isDark ? 'text-void-100' : 'text-void-800'}
                    `}
                  >
                    {themeOption.name}
                  </span>

                  {/* Light/Dark indicator */}
                  <span
                    className={`
                      ml-auto text-xs
                      ${isDark ? 'text-void-500' : 'text-void-400'}
                    `}
                  >
                    {themeOption.isDark ? 'Dark' : 'Light'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
