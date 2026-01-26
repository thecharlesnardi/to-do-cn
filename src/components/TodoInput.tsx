import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Tag, CalendarBlank, Flag, CaretDown } from '@phosphor-icons/react';
import type { Category } from '../hooks/useCategories';
import type { Priority } from '../hooks/useTodos';

interface TodoInputProps {
  onAdd: (text: string, options?: { category?: string; dueDate?: string; priority?: Priority }) => void;
  isDark: boolean;
  categories: Category[];
}

/**
 * Priority colors and labels
 */
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; darkColor: string }> = {
  low: { label: 'Low', color: '#22c55e', darkColor: '#4ade80' },
  medium: { label: 'Medium', color: '#f59e0b', darkColor: '#fbbf24' },
  high: { label: 'High', color: '#ef4444', darkColor: '#f87171' },
};

/**
 * Input form for adding new todos
 * Includes category, due date, and priority selectors
 */
export function TodoInput({ onAdd, isDark, categories }: TodoInputProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text, {
        ...(category && { category }),
        ...(dueDate && { dueDate }),
        ...(priority && { priority }),
      });
      setText('');
      setCategory('');
      setDueDate('');
      setPriority('');
      setShowOptions(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input row */}
      <div className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className={`
            flex-1 px-4 py-3 rounded-lg
            text-base
            transition-all duration-200
            outline-none
            ${isDark
              ? 'bg-void-800 border border-void-600 text-void-100 placeholder:text-void-500 focus:border-anthropic-blue'
              : 'bg-white border border-void-200 text-void-900 placeholder:text-void-400 focus:border-anthropic-blue'
            }
          `}
        />
        <button
          type="submit"
          className={`
            flex items-center justify-center gap-2
            px-5 py-3 rounded-lg
            font-medium text-base
            transition-all duration-200
            cursor-pointer
            ${isDark
              ? 'bg-ember-500 text-void-950 hover:bg-ember-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]'
              : 'bg-ember-600 text-white hover:bg-ember-500'
            }
          `}
        >
          <Plus size={20} weight="bold" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* Options toggle button */}
      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className={`
          flex items-center gap-1.5 text-sm
          transition-colors duration-200 cursor-pointer
          ${isDark
            ? 'text-void-400 hover:text-void-200'
            : 'text-void-500 hover:text-void-700'
          }
        `}
      >
        <CaretDown
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}
        />
        <span>{showOptions ? 'Hide options' : 'More options'}</span>
        {(category || dueDate || priority) && (
          <span className={`
            ml-1 px-1.5 py-0.5 text-xs rounded-full
            ${isDark ? 'bg-ember-500/20 text-ember-400' : 'bg-ember-100 text-ember-600'}
          `}>
            {[category, dueDate, priority].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Collapsible options row */}
      {showOptions && (
        <div className={`
          flex flex-wrap gap-3 p-3 rounded-lg
          ${isDark ? 'bg-void-800/50' : 'bg-void-50'}
        `}>
          {/* Category selector */}
          <div className="flex items-center gap-2">
            <Tag size={16} className={isDark ? 'text-void-400' : 'text-void-500'} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`
                px-3 py-1.5 rounded-md text-sm
                cursor-pointer outline-none
                ${isDark
                  ? 'bg-void-700 border border-void-600 text-void-100'
                  : 'bg-white border border-void-200 text-void-900'
                }
              `}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date picker */}
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} className={isDark ? 'text-void-400' : 'text-void-500'} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              className={`
                px-3 py-1.5 rounded-md text-sm
                cursor-pointer outline-none
                ${isDark
                  ? 'bg-void-700 border border-void-600 text-void-100'
                  : 'bg-white border border-void-200 text-void-900'
                }
              `}
            />
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-2">
            <Flag size={16} className={isDark ? 'text-void-400' : 'text-void-500'} />
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => {
                const config = PRIORITY_CONFIG[p];
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(isSelected ? '' : p)}
                    title={config.label}
                    className={`
                      px-2 py-1 rounded text-xs font-medium
                      transition-all duration-200 cursor-pointer
                      ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'}
                    `}
                    style={{
                      backgroundColor: isSelected
                        ? (isDark ? config.darkColor : config.color) + '20'
                        : 'transparent',
                      color: isDark ? config.darkColor : config.color,
                      border: `1px solid ${isDark ? config.darkColor : config.color}`,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${isDark ? '#141414' : '#fafafa'}, 0 0 0 4px ${isDark ? config.darkColor : config.color}`
                        : 'none',
                    }}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
