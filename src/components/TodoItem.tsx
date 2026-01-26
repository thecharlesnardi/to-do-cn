import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash, FloppyDisk, X, DotsSixVertical, CalendarBlank, Warning, CaretDown, Plus } from '@phosphor-icons/react';
import type { Todo, Priority } from '../hooks/useTodos';
import type { Category } from '../hooks/useCategories';
import { SubtaskItem } from './SubtaskItem';

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
  subtasks?: Todo[];
  onAddSubtask?: (parentId: number, text: string) => void;
  onToggleSubtask?: (id: number) => void;
  onUpdateSubtask?: (id: number, text: string) => void;
  onDeleteSubtask?: (id: number) => void;
}

const PRIORITY_COLORS: Record<Priority, { light: string; dark: string }> = {
  low: { light: '#22c55e', dark: '#4ade80' },
  medium: { light: '#f59e0b', dark: '#fbbf24' },
  high: { light: '#ef4444', dark: '#f87171' },
};

function isOverdue(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  return dueDate < today;
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

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
  subtasks = [],
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(isNew);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const prevCompletedRef = useRef(todo.completed);

  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(s => s.completed).length;

  useEffect(() => {
    if (todo.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 300);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = todo.completed;
  }, [todo.completed]);

  useEffect(() => {
    if (showEntryAnimation) {
      const timer = setTimeout(() => setShowEntryAnimation(false), 250);
      return () => clearTimeout(timer);
    }
  }, [showEntryAnimation]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

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

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() && onAddSubtask) {
      onAddSubtask(todo.id, newSubtaskText);
      setNewSubtaskText('');
      setIsAddingSubtask(false);
    }
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddSubtask();
    if (e.key === 'Escape') {
      setIsAddingSubtask(false);
      setNewSubtaskText('');
    }
  };

  const priorityBorderStyle = todo.priority
    ? {
        borderLeftWidth: '3px',
        borderLeftColor: isDark
          ? PRIORITY_COLORS[todo.priority].dark
          : PRIORITY_COLORS[todo.priority].light,
      }
    : {};

  const category = todo.category
    ? categories.find(c => c.id === todo.category)
    : null;

  const overdueStatus = todo.dueDate && !todo.completed && isOverdue(todo.dueDate);

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, ...priorityBorderStyle }}
      className={`
        group rounded-lg
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
      {/* Main todo row */}
      <div className="flex items-center gap-2 px-2 py-3">
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

        {/* Expand/collapse button for subtasks */}
        {hasSubtasks ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              p-1 rounded transition-all duration-200 cursor-pointer
              ${isDark ? 'text-void-400 hover:text-void-200' : 'text-void-500 hover:text-void-700'}
            `}
          >
            <CaretDown
              size={16}
              weight="bold"
              className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`}
            />
          </button>
        ) : (
          <div className="w-6" /> // Spacer when no subtasks
        )}

        {/* Checkbox */}
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

        {/* Today Indicator - Subtle dot */}
        <button
          onClick={() => onToggleToday(todo.id)}
          aria-label={todo.isToday ? 'Remove from Today' : 'Add to Today'}
          className={`
            flex items-center justify-center w-6 h-6 rounded transition-all duration-200 cursor-pointer
            ${todo.isToday
              ? ''
              : 'opacity-0 group-hover:opacity-100'
            }
          `}
        >
          <span
            className={`
              rounded-full transition-all duration-200
              ${todo.isToday
                ? isDark
                  ? 'w-2.5 h-2.5 bg-ember-500'
                  : 'w-2.5 h-2.5 bg-ember-600'
                : isDark
                  ? 'w-2 h-2 bg-void-600 hover:bg-ember-500'
                  : 'w-2 h-2 bg-void-300 hover:bg-ember-600'
              }
            `}
          />
        </button>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
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
                  ? 'bg-void-700 border-2 border-anthropic-blue text-void-100'
                  : 'bg-white border-2 border-anthropic-blue text-void-900'
                }
              `}
            />
          ) : (
            <div className="flex items-center gap-2">
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
              {/* Subtask count badge */}
              {hasSubtasks && (
                <span
                  className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${isDark ? 'bg-void-700 text-void-400' : 'bg-void-200 text-void-500'}
                  `}
                >
                  {completedSubtasks}/{subtasks.length}
                </span>
              )}
            </div>
          )}

          {/* Metadata row */}
          {!isEditing && (category || todo.dueDate) && (
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
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

        {/* Add subtask button */}
        {onAddSubtask && !isEditing && (
          <button
            onClick={() => setIsAddingSubtask(true)}
            aria-label="Add subtask"
            className={`
              p-2 rounded-md transition-all duration-200 cursor-pointer
              opacity-0 group-hover:opacity-100
              ${isDark
                ? 'text-void-400 hover:text-ember-500 hover:bg-void-700'
                : 'text-void-500 hover:text-ember-600 hover:bg-void-200'
              }
            `}
          >
            <Plus size={16} weight="bold" />
          </button>
        )}

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
      </div>

      {/* Add subtask input */}
      {isAddingSubtask && (
        <div className="flex items-center gap-2 px-2 pb-3 ml-8">
          <input
            type="text"
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            onKeyDown={handleSubtaskKeyDown}
            placeholder="Add subtask..."
            autoFocus
            className={`
              flex-1 px-3 py-1.5 rounded-md text-sm outline-none
              ${isDark
                ? 'bg-void-700 border-2 border-anthropic-blue/50 text-void-100 placeholder-void-500'
                : 'bg-white border-2 border-anthropic-blue/50 text-void-900 placeholder-void-400'
              }
            `}
          />
          <button
            onClick={handleAddSubtask}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer
              ${isDark
                ? 'bg-ember-500 text-void-900 hover:bg-ember-400'
                : 'bg-ember-600 text-white hover:bg-ember-500'
              }
            `}
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAddingSubtask(false);
              setNewSubtaskText('');
            }}
            className={`
              p-1.5 rounded-md cursor-pointer
              ${isDark
                ? 'text-void-400 hover:bg-void-700'
                : 'text-void-500 hover:bg-void-200'
              }
            `}
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Subtasks list */}
      {isExpanded && hasSubtasks && (
        <ul className="pb-2 space-y-2">
          {subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={onToggleSubtask || (() => {})}
              onUpdate={onUpdateSubtask || (() => {})}
              onDelete={onDeleteSubtask || (() => {})}
              isDark={isDark}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
