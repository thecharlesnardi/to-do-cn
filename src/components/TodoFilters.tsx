interface TodoFiltersProps {
  filter: 'today' | 'all';
  onFilterChange: (filter: 'today' | 'all') => void;
  todayCount: number;
  allCount: number;
  isDark: boolean;
}

/**
 * Filter toggle for Today/All views
 * Today is the default focused view
 */
export function TodoFilters({ filter, onFilterChange, todayCount, allCount, isDark }: TodoFiltersProps) {
  return (
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
        onClick={() => onFilterChange('all')}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-md
          transition-all duration-200 cursor-pointer
          ${filter === 'all'
            ? isDark
              ? 'bg-void-700 text-ember-500 shadow-sm'
              : 'bg-white text-ember-600 shadow-sm'
            : isDark
              ? 'text-void-400 hover:text-void-200'
              : 'text-void-500 hover:text-void-700'
          }
        `}
      >
        All {allCount > 0 && <span className="ml-1 opacity-70">({allCount})</span>}
      </button>
    </div>
  );
}
