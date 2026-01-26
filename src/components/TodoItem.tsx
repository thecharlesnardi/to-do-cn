import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Pencil, Trash, FloppyDisk, X, DotsSixVertical } from '@phosphor-icons/react';
import type { Todo } from '../hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onUpdate: (id: number, text: string) => void;
  onDelete: (id: number) => void;
  isDark: boolean;
}

/**
 * Individual todo item with:
 * - Drag handle for reordering
 * - Custom checkbox with animation
 * - Inline editing
 * - Delete with hover reveal
 */
export function TodoItem({ todo, onToggle, onUpdate, onDelete, isDark }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-2 py-3 rounded-lg
        transition-all duration-200
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

      {/* Custom Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
        className={`
          relative flex-shrink-0 w-6 h-6 rounded-md
          border-2 transition-all duration-200
          cursor-pointer
          ${todo.completed
            ? isDark
              ? 'bg-ember-500 border-ember-500'
              : 'bg-ember-600 border-ember-600'
            : isDark
              ? 'border-void-500 hover:border-ember-500'
              : 'border-void-300 hover:border-ember-600'
          }
        `}
      >
        {todo.completed && (
          <Check
            size={16}
            weight="bold"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
          />
        )}
      </button>

      {/* Todo Text or Edit Input */}
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`
            flex-1 px-3 py-1.5 rounded-md
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
            flex-1 text-base transition-all duration-200
            ${todo.completed
              ? 'line-through ' + (isDark ? 'text-void-500' : 'text-void-400')
              : isDark ? 'text-void-100' : 'text-void-800'
            }
          `}
        >
          {todo.text}
        </span>
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
    </li>
  );
}
