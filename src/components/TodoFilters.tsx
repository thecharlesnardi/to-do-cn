import { useState, useRef, useEffect } from 'react';
import { FunnelSimple, CaretDown, Check } from '@phosphor-icons/react';
import type { Category } from '../hooks/useCategories';

interface TodoFiltersProps {
  filter: 'today' | 'later';
  onFilterChange: (filter: 'today' | 'later') => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  todayCount: number;
  laterCount: number;
  isDark: boolean;
  categories: Category[];
  getCategoryColor: (id: string) => string;
}

/**
 * Filter toggle for Today/Later views with category dropdown
 */
export function TodoFilters({
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  todayCount,
  laterCount,
  isDark,
  categories,
  getCategoryColor,
}: TodoFiltersProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const selectedCategory = categories.find(c => c.id === categoryFilter);

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Main filter toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-void-100 dark:bg-void-800/50">
        <button
          onClick={() => onFilterChange('today')}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md
            transition-all duration-200 cursor-pointer
            ${filter === 'today'
              ? isDark
                ? 'bg-void-700 text-ember-500 shadow-sm'
                : 'bg-white text-ember-600 shadow-sm'
              : isDark
                ? 'text-void-400 hover:text-void-200'
                : 'text-void-500 hover:text-void-700'
            }
          `}
        >
          Today {todayCount > 0 && <span className="ml-1 opacity-70">({todayCount})</span>}
        </button>
        <button
          onClick={() => onFilterChange('later')}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md
            transition-all duration-200 cursor-pointer
            ${filter === 'later'
              ? isDark
                ? 'bg-void-700 text-[#4A90D9] shadow-sm'
                : 'bg-white text-[#3B7BC0] shadow-sm'
              : isDark
                ? 'text-void-400 hover:text-void-200'
                : 'text-void-500 hover:text-void-700'
            }
          `}
        >
          Later {laterCount > 0 && <span className="ml-1 opacity-70">({laterCount})</span>}
        </button>
      </div>

      {/* Category dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg
            text-sm font-medium transition-all duration-200 cursor-pointer
            ${categoryFilter
              ? 'border-2'
              : isDark
                ? 'bg-void-800/50 text-void-400 hover:text-void-200'
                : 'bg-void-100 text-void-500 hover:text-void-700'
            }
          `}
          style={categoryFilter ? {
            backgroundColor: getCategoryColor(categoryFilter) + '15',
            borderColor: getCategoryColor(categoryFilter),
            color: getCategoryColor(categoryFilter),
          } : undefined}
        >
          <FunnelSimple size={16} weight={categoryFilter ? 'fill' : 'regular'} />
          {selectedCategory ? selectedCategory.name : 'Filter'}
          <CaretDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div
            className={`
              absolute right-0 top-full mt-2 py-1
              min-w-[160px] rounded-lg shadow-lg border z-50
              ${isDark
                ? 'bg-void-800 border-void-700'
                : 'bg-white border-void-200'
              }
            `}
          >
            {/* All Categories option */}
            <button
              onClick={() => {
                onCategoryFilterChange('');
                setIsDropdownOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm
                transition-colors cursor-pointer
                ${!categoryFilter
                  ? isDark ? 'bg-void-700/50' : 'bg-void-50'
                  : isDark
                    ? 'hover:bg-void-700/50'
                    : 'hover:bg-void-50'
                }
                ${isDark ? 'text-void-100' : 'text-void-800'}
              `}
            >
              <span>All Categories</span>
              {!categoryFilter && <Check size={16} weight="bold" className={isDark ? 'text-ember-500' : 'text-ember-600'} />}
            </button>

            {/* Divider */}
            <div className={`my-1 h-px ${isDark ? 'bg-void-700' : 'bg-void-200'}`} />

            {/* Category options */}
            {categories.map((cat) => {
              const isActive = categoryFilter === cat.id;
              const color = getCategoryColor(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryFilterChange(isActive ? '' : cat.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm
                    transition-colors cursor-pointer
                    ${isActive
                      ? isDark ? 'bg-void-700/50' : 'bg-void-50'
                      : isDark
                        ? 'hover:bg-void-700/50'
                        : 'hover:bg-void-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className={isDark ? 'text-void-100' : 'text-void-800'}>
                      {cat.name}
                    </span>
                  </div>
                  {isActive && <Check size={16} weight="bold" style={{ color }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
