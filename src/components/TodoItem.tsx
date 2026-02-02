import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash, FloppyDisk, X, DotsSixVertical, CalendarBlank, Warning, CaretDown, Plus, Flag } from '@phosphor-icons/react';
import type { Todo, Priority } from '../hooks/useTodos';
import type { Category } from '../hooks/useCategories';
import { SubtaskItem } from './SubtaskItem';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onToggleToday: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  onUpdateCategory?: (id: number, category: string | undefined) => void;
  onUpdatePriority?: (id: number, priority: Priority | undefined) => void;
  isDark: boolean;
  isNew?: boolean;
  categories: Category[];
  getCategoryColor: (id: string) => string;
  subtasks?: Todo[];
  onAddSubtask?: (parentId: number, text: string) => void;
  onToggleSubtask?: (id: number) => void;
  onUpdateSubtask?: (id: number, text: string) => void;
  onDeleteSubtask?: (id: number) => void;
  onReorderSubtasks?: (parentId: number, activeId: number, overId: number) => void;
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
  onUpdateCategory,
  onUpdatePriority,
  isDark,
  isNew,
  categories,
  getCategoryColor,
  subtasks = [],
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderSubtasks,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showEntryAnimation, setShowEntryAnimation] = useState(isNew);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);
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

  // Close category picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setShowCategoryPicker(false);
      }
    }
    if (showCategoryPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryPicker]);

  // Close priority picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
        setShowPriorityPicker(false);
      }
    }
    if (showPriorityPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPriorityPicker]);

  // Drag sensors for subtask reordering
  const subtaskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle subtask drag end
  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderSubtasks) {
      onReorderSubtasks(todo.id, active.id as number, over.id as number);
    }
  };

  // Swipe-to-delete touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    // Only allow swiping left (positive diff), cap at 150px
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 150));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    // If swiped more than 100px, trigger delete
    if (swipeOffset > 100) {
      onDelete(todo.id);
    }
    setSwipeOffset(0);
  };

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

  // Swipe background color based on offset
  const swipeProgress = Math.min(swipeOffset / 100, 1);

  return (
    <li
      ref={setNodeRef}
      style={{ ...style, ...priorityBorderStyle }}
      className={`
        group rounded-lg relative overflow-hidden
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete reveal background */}
      {swipeOffset > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-danger"
          style={{
            width: swipeOffset,
            opacity: swipeProgress,
          }}
        >
          <Trash size={20} weight="bold" className="text-white" />
        </div>
      )}
      {/* Main todo row - restructured for mobile: stacked layout on small screens */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 px-2 py-3 relative"
        style={{
          transform: swipeOffset > 0 ? `translateX(-${swipeOffset}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
          backgroundColor: isDark ? 'rgb(17 17 17)' : 'white',
        }}
      >
        {/* Primary row: drag handle, expand, checkbox, and text */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className={`
              flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing
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
                flex-shrink-0 p-1 rounded transition-all duration-200 cursor-pointer
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
            <div className="flex-shrink-0 w-6" />
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

          {/* Main content - text and metadata */}
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
              <div className="flex items-center gap-2 min-w-0">
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
                      flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full
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
        </div>

        {/* Actions row: wraps to second line on mobile */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto pl-2 sm:pl-0 sm:ml-0">
          {/* Today Indicator - Subtle dot */}
          <button
            onClick={() => onToggleToday(todo.id)}
            title={todo.isToday ? 'Remove from Today' : 'Add to Today'}
            aria-label={todo.isToday ? 'Remove from Today' : 'Add to Today'}
            className={`
              flex-shrink-0 flex items-center justify-center w-6 h-6 rounded transition-all duration-200 cursor-pointer
              ${todo.isToday
                ? ''
                : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
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

          {/* Category Picker Dot */}
          {onUpdateCategory && (
            <div className="relative flex-shrink-0" ref={categoryPickerRef}>
              <button
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                title="Change category"
                aria-label="Change category"
                className={`
                  flex items-center justify-center w-6 h-6 rounded transition-all duration-200 cursor-pointer
                  ${todo.category || showCategoryPicker
                    ? ''
                    : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  }
                `}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: todo.category
                      ? getCategoryColor(todo.category)
                      : isDark ? '#4a4a4a' : '#9ca3af',
                  }}
                />
              </button>

              {/* Category dropdown */}
              {showCategoryPicker && (
                <div
                  className={`
                    absolute right-0 sm:left-0 top-full mt-1 py-1 z-50
                    min-w-[140px] rounded-lg shadow-lg border
                    ${isDark
                      ? 'bg-void-800 border-void-700'
                      : 'bg-white border-void-200'
                    }
                  `}
                >
                  {/* No category option */}
                  <button
                    onClick={() => {
                      onUpdateCategory(todo.id, undefined);
                      setShowCategoryPicker(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer
                      ${isDark ? 'hover:bg-void-700' : 'hover:bg-void-50'}
                    `}
                  >
                    <span
                      className="w-3 h-3 rounded-full border-2"
                      style={{ borderColor: isDark ? '#4a4a4a' : '#9ca3af' }}
                    />
                    <span className={isDark ? 'text-void-300' : 'text-void-600'}>
                      None
                    </span>
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onUpdateCategory(todo.id, cat.id);
                        setShowCategoryPicker(false);
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer
                        ${isDark ? 'hover:bg-void-700' : 'hover:bg-void-50'}
                        ${todo.category === cat.id ? (isDark ? 'bg-void-700/50' : 'bg-void-50') : ''}
                      `}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(cat.id) }}
                      />
                      <span className={isDark ? 'text-void-100' : 'text-void-800'}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Priority Picker */}
          {onUpdatePriority && (
            <div className="relative flex-shrink-0" ref={priorityPickerRef}>
              <button
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                aria-label="Change priority"
                className={`
                  flex items-center justify-center w-6 h-6 rounded transition-all duration-200 cursor-pointer
                  ${todo.priority || showPriorityPicker
                    ? ''
                    : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                  }
                `}
              >
                <Flag
                  size={14}
                  weight={todo.priority ? 'fill' : 'regular'}
                  style={{
                    color: todo.priority
                      ? isDark
                        ? PRIORITY_COLORS[todo.priority].dark
                        : PRIORITY_COLORS[todo.priority].light
                      : isDark ? '#4a4a4a' : '#9ca3af',
                  }}
                />
              </button>

              {/* Priority dropdown */}
              {showPriorityPicker && (
                <div
                  className={`
                    absolute right-0 sm:left-0 top-full mt-1 py-1 z-50
                    min-w-[120px] rounded-lg shadow-lg border
                    ${isDark
                      ? 'bg-void-800 border-void-700'
                      : 'bg-white border-void-200'
                    }
                  `}
                >
                  {/* No priority option */}
                  <button
                    onClick={() => {
                      onUpdatePriority(todo.id, undefined);
                      setShowPriorityPicker(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer
                      ${isDark ? 'hover:bg-void-700' : 'hover:bg-void-50'}
                      ${!todo.priority ? (isDark ? 'bg-void-700/50' : 'bg-void-50') : ''}
                    `}
                  >
                    <Flag size={14} weight="regular" className={isDark ? 'text-void-500' : 'text-void-400'} />
                    <span className={isDark ? 'text-void-300' : 'text-void-600'}>
                      None
                    </span>
                  </button>

                  {/* Priority options */}
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      onClick={() => {
                        onUpdatePriority(todo.id, priority);
                        setShowPriorityPicker(false);
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer
                        ${isDark ? 'hover:bg-void-700' : 'hover:bg-void-50'}
                        ${todo.priority === priority ? (isDark ? 'bg-void-700/50' : 'bg-void-50') : ''}
                      `}
                    >
                      <Flag
                        size={14}
                        weight="fill"
                        style={{
                          color: isDark
                            ? PRIORITY_COLORS[priority].dark
                            : PRIORITY_COLORS[priority].light,
                        }}
                      />
                      <span className={isDark ? 'text-void-100' : 'text-void-800'}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add subtask button */}
          {onAddSubtask && !isEditing && (
            <button
              onClick={() => setIsAddingSubtask(true)}
              aria-label="Add subtask"
              className={`
                flex-shrink-0 p-2 rounded-md transition-all duration-200 cursor-pointer
                opacity-100 sm:opacity-0 sm:group-hover:opacity-100
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
            flex gap-1 flex-shrink-0
            transition-opacity duration-200
            ${isEditing ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}
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

      {/* Subtasks list with drag-and-drop */}
      {isExpanded && hasSubtasks && (
        <DndContext
          sensors={subtaskSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSubtaskDragEnd}
        >
          <SortableContext
            items={subtasks.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Grouped subtask container */}
            <div
              className={`
                ml-10 mr-2 mb-2 py-1.5 px-1 rounded-t-lg
                ${isDark
                  ? 'bg-void-800/40'
                  : 'bg-void-100/60'
                }
              `}
            >
              <ul className="space-y-0.5">
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
            </div>
          </SortableContext>
        </DndContext>
      )}
    </li>
  );
}
