import type { Category } from '../hooks/useCategories';

interface TodoFiltersProps {
  filter: 'today' | 'all';
  onFilterChange: (filter: 'today' | 'all') => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  todayCount: number;
  allCount: number;
  isDark: boolean;
  categories: Category[];
  getCategoryColor: (id: string) => string;
}

/**
 * Filter toggle for Today/All views with category filter
 * Today is the default focused view
 */
export function TodoFilters({
  filter,
  onFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  todayCount,
  allCount,
  isDark,
  categories,
  getCategoryColor,
}: TodoFiltersProps) {
  return (
    <div className="space-y-3">
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

      {/* Category filter chips - horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => onCategoryFilterChange('')}
          className={`
            flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full
            transition-all duration-200 cursor-pointer border
            ${categoryFilter === ''
              ? isDark
                ? 'bg-void-600 border-void-500 text-void-100'
                : 'bg-void-200 border-void-300 text-void-800'
              : isDark
                ? 'bg-transparent border-void-700 text-void-400 hover:text-void-200 hover:border-void-500'
                : 'bg-transparent border-void-200 text-void-500 hover:text-void-700 hover:border-void-400'
            }
          `}
        >
          All Categories
        </button>
        {categories.map((cat) => {
          const isActive = categoryFilter === cat.id;
          const color = getCategoryColor(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryFilterChange(isActive ? '' : cat.id)}
              className={`
                flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full
                transition-all duration-200 cursor-pointer border
                ${isActive
                  ? 'border-transparent'
                  : 'border-transparent opacity-60 hover:opacity-100'
                }
              `}
              style={{
                backgroundColor: isActive ? color + '30' : color + '15',
                color: color,
                borderColor: isActive ? color : 'transparent',
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
