import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash, FloppyDisk, X, DotsSixVertical } from '@phosphor-icons/react';
import type { Todo } from '../hooks/useTodos';

interface SubtaskItemProps {
  subtask: Todo;
  onToggle: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  isDark: boolean;
}

/**
 * Simplified todo row for subtasks
 * - Indented display
 * - Checkbox, text, edit/delete buttons
 * - Drag handle for reordering
 */
export function SubtaskItem({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
  isDark,
}: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(subtask.text);
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompletedRef = useRef(subtask.completed);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (subtask.completed && !prevCompletedRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 300);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = subtask.completed;
  }, [subtask.completed]);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(subtask.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(subtask.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-3 py-1.5 rounded-md
        transition-all duration-200
        ${justCompleted ? 'todo-item-complete' : ''}
        ${isDragging
          ? isDark
            ? 'bg-void-700 shadow-lg opacity-90'
            : 'bg-white shadow-lg opacity-90'
          : isDark
            ? 'bg-void-700/50 hover:bg-void-700/70 border-l-2 border-ember-500/30'
            : 'bg-white/70 hover:bg-white/90 border-l-2 border-ember-600/30'
        }
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className={`
          flex-shrink-0 p-0.5 rounded cursor-grab active:cursor-grabbing
          transition-colors duration-200
          ${isDark
            ? 'text-void-600 hover:text-void-400'
            : 'text-void-300 hover:text-void-500'
          }
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
      >
        <DotsSixVertical size={14} weight="bold" />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(subtask.id)}
        aria-label={subtask.completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={`
          relative flex-shrink-0 w-5 h-5 rounded
          border-2 transition-all duration-200 cursor-pointer
          ${subtask.completed
            ? `${justCompleted ? 'checkbox-animate' : ''} ${isDark ? 'bg-ember-500 border-ember-500' : 'bg-ember-600 border-ember-600'}`
            : isDark
              ? 'border-void-500 hover:border-ember-500'
              : 'border-void-300 hover:border-ember-600'
          }
        `}
      >
        {subtask.completed && (
          <svg
            viewBox="0 0 24 24"
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 checkmark-svg ${justCompleted ? 'animate' : ''}`}
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

      {/* Text */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className={`
              w-full px-2 py-1 rounded text-sm outline-none
              ${isDark
                ? 'bg-void-700 border-2 border-anthropic-blue text-void-100'
                : 'bg-white border-2 border-anthropic-blue text-void-900'
              }
            `}
          />
        ) : (
          <span
            className={`
              text-sm transition-all duration-200 truncate block
              ${subtask.completed
                ? 'line-through ' + (isDark ? 'text-void-600' : 'text-void-400')
                : isDark ? 'text-void-300' : 'text-void-600'
              }
            `}
          >
            {subtask.text}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className={`
        flex gap-1
        transition-opacity duration-200
        ${isEditing ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}
      `}>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              aria-label="Save"
              className={`
                p-1.5 rounded transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-success hover:bg-success/20'
                  : 'text-success hover:bg-success/10'
                }
              `}
            >
              <FloppyDisk size={14} weight="bold" />
            </button>
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              className={`
                p-1.5 rounded transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:bg-void-700'
                  : 'text-void-500 hover:bg-void-200'
                }
              `}
            >
              <X size={14} weight="bold" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Edit"
              className={`
                p-1.5 rounded transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:text-ember-500 hover:bg-void-700'
                  : 'text-void-500 hover:text-ember-600 hover:bg-void-200'
                }
              `}
            >
              <Pencil size={14} weight="bold" />
            </button>
            <button
              onClick={() => onDelete(subtask.id)}
              aria-label="Delete"
              className={`
                p-1.5 rounded transition-all duration-200 cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:text-danger hover:bg-danger/20'
                  : 'text-void-500 hover:text-danger hover:bg-danger/10'
                }
              `}
            >
              <Trash size={14} weight="bold" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
