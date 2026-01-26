import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash, FloppyDisk, X, DotsSixVertical, Star, CalendarBlank, Warning } from '@phosphor-icons/react';
import type { Todo, Priority } from '../hooks/useTodos';
import type { Category } from '../hooks/useCategories';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onToggleToday: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  isDark: boolean;
  isNew?: boolean;
  categories: Category[];
  getCategoryColor: (id: string) => string;
}

/**
 * Priority border colors
 */
const PRIORITY_COLORS: Record<Priority, { light: string; dark: string }> = {
  low: { light: '#22c55e', dark: '#4ade80' },
  medium: { light: '#f59e0b', dark: '#fbbf24' },
  high: { light: '#ef4444', dark: '#f87171' },
};

/**
 * Check if a date string is overdue (before today)
 */
function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  return dueDate < today;
}

/**
 * Check if a date is today
 */
function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

/**
 * Format due date for display
 */
function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isToday(dateStr)) return 'Today';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Individual todo item with:
 * - Drag handle for reordering
 * - Custom checkbox with animation
 * - Category badge
 * - Due date display with overdue highlighting
 * - Priority indicator (left border)
 * - Inline editing
 * - Delete with hover reveal
 */
export function TodoItem({
  todo,
  onToggle,
  onToggleToday,
  onUpdate,
  onDelete,
  isDark,
  isNew,
  categories,
  getCategoryColor,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(isNew);
  const prevCompletedRef = useRef(todo.completed);

  // Track when task goes from incomplete to complete
  useEffect(() => {
    if (todo.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 300);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = todo.completed;
  }, [todo.completed]);

  // Clear entry animation after it plays
  useEffect(() => {
    if (showEntryAnimation) {
      const timer = setTimeout(() => setShowEntryAnimation(false), 250);
      return () => clearTimeout(timer);
    }
  }, [showEntryAnimation]);

  // Sortable hook from dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  // Apply transform styles during drag
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(todo.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  // Get priority border style
  const priorityBorderStyle = todo.priority
    ? {
        borderLeftWidth: '3px',
        borderLeftColor: isDark
          ? PRIORITY_COLORS[todo.priority].dark
          : PRIORITY_COLORS[todo.priority].light,
      }
    : {};

  // Get category info
  const category = todo.category
    ? categories.find(c => c.id === todo.category)
    : null;

  // Check if overdue
  const overdueStatus = todo.dueDate && !todo.completed && isOverdue(todo.dueDate);

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, ...priorityBorderStyle }}
      className={`
        group flex items-center gap-2 px-2 py-3 rounded-lg
        transition-all duration-200
        ${showEntryAnimation ? 'todo-item-enter' : ''}
        ${justCompleted ? 'todo-item-complete' : ''}
        ${isDragging
          ? isDark
            ? 'bg-void-700 shadow-lg shadow-ember-500/10 opacity-90 scale-[1.02]'
            : 'bg-white shadow-lg opacity-90 scale-[1.02]'
          : isDark
            ? 'hover:bg-void-800/50'
            : 'hover:bg-void-100/50'
        }
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className={`
          p-1 rounded cursor-grab active:cursor-grabbing
          transition-colors duration-200
          ${isDark
            ? 'text-void-600 hover:text-void-400'
            : 'text-void-300 hover:text-void-500'
          }
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
      >
        <DotsSixVertical size={20} weight="bold" />
      </button>

      {/* Custom Checkbox with animated checkmark */}
      <button
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={`
          relative flex-shrink-0 w-6 h-6 rounded-md
          border-2 transition-all duration-200
          cursor-pointer
          ${todo.completed
            ? `${justCompleted ? 'checkbox-animate' : ''} ${isDark ? 'bg-ember-500 border-ember-500' : 'bg-ember-600 border-ember-600'}`
            : isDark
              ? 'border-void-500 hover:border-ember-500'
              : 'border-void-300 hover:border-ember-600'
          }
        `}
      >
        {todo.completed && (
          <svg
            viewBox="0 0 24 24"
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 checkmark-svg ${justCompleted ? 'animate' : ''}`}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={!justCompleted ? { strokeDashoffset: 0 } : undefined}
          >
            <polyline points="4 12 10 18 20 6" />
          </svg>
        )}
      </button>

      {/* Today Star Button */}
      <button
        onClick={() => onToggleToday(todo.id)}
        aria-label={todo.isToday ? 'Remove from Today' : 'Add to Today'}
        className={`
          p-1 rounded transition-all duration-200 cursor-pointer
          ${todo.isToday
            ? isDark
              ? 'text-ember-500 hover:text-ember-400'
              : 'text-ember-600 hover:text-ember-500'
            : isDark
              ? 'text-void-600 hover:text-ember-500 opacity-0 group-hover:opacity-100'
              : 'text-void-300 hover:text-ember-600 opacity-0 group-hover:opacity-100'
          }
          ${todo.isToday ? 'opacity-100' : ''}
        `}
      >
        <Star size={18} weight={todo.isToday ? 'fill' : 'regular'} />
      </button>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Todo Text or Edit Input */}
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={`
              w-full px-3 py-1.5 rounded-md
              text-base outline-none
              ${isDark
                ? 'bg-void-700 border-2 border-ember-500 text-void-100'
                : 'bg-white border-2 border-ember-600 text-void-900'
              }
            `}
          />
        ) : (
          <span
            className={`
              text-base transition-all duration-200 truncate
              ${todo.completed
                ? 'line-through ' + (isDark ? 'text-void-500' : 'text-void-400')
                : isDark ? 'text-void-100' : 'text-void-800'
              }
            `}
          >
            {todo.text}
          </span>
        )}

        {/* Metadata row (category + due date) */}
        {!isEditing && (category || todo.dueDate) && (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {/* Category badge */}
            {category && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: getCategoryColor(category.id) + '20',
                  color: getCategoryColor(category.id),
                }}
              >
                {category.name}
              </span>
            )}

            {/* Due date */}
            {todo.dueDate && (
              <span
                className={`
                  flex items-center gap-1 text-xs
                  ${overdueStatus
                    ? 'text-danger font-medium'
                    : isToday(todo.dueDate)
                      ? isDark ? 'text-ember-400' : 'text-ember-600'
                      : isDark ? 'text-void-400' : 'text-void-500'
                  }
                `}
              >
                {overdueStatus ? (
                  <Warning size={12} weight="fill" />
                ) : (
                  <CalendarBlank size={12} />
                )}
                {formatDueDate(todo.dueDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`
        flex gap-1
        transition-opacity duration-200
        ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              aria-label="Save"
              className={`
                p-2 rounded-md transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-success hover:bg-success/20'
                  : 'text-success hover:bg-success/10'
                }
              `}
            >
              <FloppyDisk size={18} weight="bold" />
            </button>
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              className={`
                p-2 rounded-md transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:bg-void-700'
                  : 'text-void-500 hover:bg-void-200'
                }
              `}
            >
              <X size={18} weight="bold" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Edit"
              className={`
                p-2 rounded-md transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:text-ember-500 hover:bg-void-700'
                  : 'text-void-500 hover:text-ember-600 hover:bg-void-200'
                }
              `}
            >
              <Pencil size={18} weight="bold" />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              aria-label="Delete"
              className={`
                p-2 rounded-md transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:text-danger hover:bg-danger/20'
                  : 'text-void-500 hover:text-danger hover:bg-danger/10'
                }
              `}
            >
              <Trash size={18} weight="bold" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
