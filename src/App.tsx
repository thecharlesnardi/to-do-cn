import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTheme } from './hooks/useTheme';
import { useTodos } from './hooks/useTodos';
import { ThemeToggle } from './components/ThemeToggle';
import { TodoInput } from './components/TodoInput';
import { TodoItem } from './components/TodoItem';
import { EmptyState } from './components/EmptyState';

/**
 * Main Todo App
 * Space-futurism design with near-black dark mode
 * Drag-to-reorder functionality with @dnd-kit
 */
function App() {
  const { isDark, toggleTheme } = useTheme();
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo, reorderTodos } = useTodos();

  // Set up drag sensors (pointer for mouse/touch, keyboard for accessibility)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder the todos
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderTodos(active.id as number, over.id as number);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12 sm:py-16">
      {/* Main Container */}
      <div
        className={`
          w-full max-w-lg
          rounded-2xl
          border
          transition-all duration-300
          ${isDark
            ? 'bg-void-800/80 border-void-700 shadow-[0_0_40px_rgba(0,0,0,0.5)]'
            : 'bg-white border-void-200 shadow-xl'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h1
              className={`
                text-2xl font-semibold tracking-tight
                ${isDark ? 'text-void-50' : 'text-void-900'}
              `}
            >
              Tasks
            </h1>
            <p
              className={`
                text-sm mt-1
                ${isDark ? 'text-void-400' : 'text-void-500'}
              `}
            >
              {todos.length === 0
                ? 'Start your day'
                : `${todos.filter(t => !t.completed).length} remaining`}
            </p>
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        {/* Input */}
        <div className="p-6">
          <TodoInput onAdd={addTodo} isDark={isDark} />
        </div>

        {/* Divider */}
        <div
          className={`
            mx-6 h-px
            ${isDark ? 'bg-void-700' : 'bg-void-200'}
          `}
        />

        {/* Todo List with Drag and Drop */}
        <div className="p-3">
          {todos.length === 0 ? (
            <EmptyState isDark={isDark} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={todos.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {todos.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onUpdate={updateTodo}
                      onDelete={deleteTodo}
                      isDark={isDark}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div
            className={`
              px-6 py-4 text-xs text-center
              border-t
              ${isDark
                ? 'border-void-700 text-void-500'
                : 'border-void-200 text-void-400'
              }
            `}
          >
            {todos.filter(t => t.completed).length} of {todos.length} completed
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
