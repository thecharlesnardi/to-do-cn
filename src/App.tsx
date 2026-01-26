import { useState, useEffect, useRef } from 'react';
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
import { Gear } from '@phosphor-icons/react';
import { useTheme } from './hooks/useTheme';
import { useTodos } from './hooks/useTodos';
import { useCategories } from './hooks/useCategories';
import { useStats } from './hooks/useStats';
import { useSettings } from './hooks/useSettings';
import { useSound, triggerHaptic } from './hooks/useSound';
import { ThemeToggle } from './components/ThemeToggle';
import { TodoInput } from './components/TodoInput';
import { TodoItem } from './components/TodoItem';
import { TodoFilters } from './components/TodoFilters';
import { EmptyState } from './components/EmptyState';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { DateTimeHeader } from './components/DateTimeHeader';
import { Confetti } from './components/Confetti';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo, reorderTodos, toggleToday, clearCompleted, clearAllTodos, addSubtask, toggleSubtask, deleteSubtask, getSubtasks } = useTodos();
  const { categories, getCategoryColor } = useCategories();
  const { stats, completedToday, completedThisWeek, recordCompletion, justHitMilestone, clearMilestone, resetStats } = useStats();
  const { settings, toggleSound, setTimezone, toggleTimeFormat } = useSettings();
  const { playComplete } = useSound(settings.soundEnabled);

  const [newTodoId, setNewTodoId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'today' | 'later'>(() => {
    const saved = localStorage.getItem('todo-filter');
    return (saved === 'later' || saved === 'today') ? saved : 'today';
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [hasEverHadTasks, setHasEverHadTasks] = useState(() => {
    const saved = localStorage.getItem('todos-react');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 || localStorage.getItem('has-used-todos') === 'true';
      } catch {
        return false;
      }
    }
    return localStorage.getItem('has-used-todos') === 'true';
  });
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const prevTodosLengthRef = useRef(todos.length);

  // Wrap toggleTodo to track completions with sound and haptic
  const handleToggle = (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      recordCompletion();
      playComplete();
      triggerHaptic();
    }
    toggleTodo(id);
  };

  // Persist filter preference
  useEffect(() => {
    localStorage.setItem('todo-filter', filter);
  }, [filter]);

  // Filter to root todos only (no parentId) for main list
  const rootTodos = todos.filter(t => !t.parentId);

  // Compute filtered and display todos
  const todayTodos = rootTodos.filter(t => t.isToday);
  const laterTodos = rootTodos.filter(t => !t.isToday);

  // Apply both view filter and category filter
  let filteredTodos = filter === 'today' ? todayTodos : laterTodos;
  if (categoryFilter) {
    filteredTodos = filteredTodos.filter(t => t.category === categoryFilter);
  }

  const completedTodos = todos.filter(t => t.completed);

  // Track when user has added tasks (for empty state context)
  useEffect(() => {
    if (todos.length > 0 && !hasEverHadTasks) {
      setHasEverHadTasks(true);
      localStorage.setItem('has-used-todos', 'true');
    }
  }, [todos.length, hasEverHadTasks]);

  // Track when a new todo is added (length increased)
  useEffect(() => {
    if (todos.length > prevTodosLengthRef.current && todos.length > 0) {
      const lastTodo = todos[todos.length - 1];
      setNewTodoId(lastTodo.id);
      const timer = setTimeout(() => setNewTodoId(null), 300);
      return () => clearTimeout(timer);
    }
    prevTodosLengthRef.current = todos.length;
  }, [todos]);

  // Set up drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTodos(active.id as number, over.id as number);
    }
  };

  const handleClearCompleted = () => {
    clearCompleted();
    setShowSettingsModal(false);
  };

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      resetStats();
      setShowSettingsModal(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-8 sm:py-12 md:py-16">
      {/* Confetti for milestones */}
      <Confetti isActive={justHitMilestone !== null} onComplete={clearMilestone} />

      {/* Stats Modal */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        isDark={isDark}
        completedToday={completedToday}
        completedThisWeek={completedThisWeek}
        totalCompleted={stats.totalCompleted}
        streak={stats.streak}
        bestStreak={stats.bestStreak}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        isDark={isDark}
        soundEnabled={settings.soundEnabled}
        onSoundToggle={toggleSound}
        timezone={settings.timezone}
        onTimezoneChange={setTimezone}
        use24Hour={settings.use24Hour}
        onTimeFormatToggle={toggleTimeFormat}
        onClearCompleted={handleClearCompleted}
        onClearAllTasks={clearAllTodos}
        onResetStats={handleResetStats}
        completedCount={completedTodos.length}
        totalCount={todos.length}
      />

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
        {/* Date/Time Header */}
        <DateTimeHeader
          timezone={settings.timezone}
          use24Hour={settings.use24Hour}
          isDark={isDark}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pb-0">
          <h1
            className={`
              text-xl sm:text-2xl font-semibold tracking-tight
              ${isDark ? 'text-void-50' : 'text-void-900'}
            `}
          >
            Tasks
            {rootTodos.length > 0 && (
              <span className={`text-sm font-normal ml-2 ${isDark ? 'text-void-400' : 'text-void-500'}`}>
                {rootTodos.filter(t => !t.completed).length} remaining
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              aria-label="Settings"
              className={`
                p-2 rounded-lg transition-colors cursor-pointer
                ${isDark
                  ? 'text-void-400 hover:text-void-200 hover:bg-void-700'
                  : 'text-void-500 hover:text-void-700 hover:bg-void-100'
                }
              `}
            >
              <Gear size={20} weight="bold" />
            </button>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6">
          <TodoInput
            onAdd={addTodo}
            isDark={isDark}
            categories={categories}
          />
        </div>

        {/* Divider */}
        <div className={`mx-4 sm:mx-6 h-px ${isDark ? 'bg-void-700' : 'bg-void-200'}`} />

        {/* Filter Toggle */}
        {rootTodos.length > 0 && (
          <div className="px-4 sm:px-6 pt-4 pb-2">
            <TodoFilters
              filter={filter}
              onFilterChange={setFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              todayCount={todayTodos.filter(t => !t.completed).length}
              laterCount={laterTodos.filter(t => !t.completed).length}
              isDark={isDark}
              categories={categories}
              getCategoryColor={getCategoryColor}
            />
          </div>
        )}

        {/* Todo List */}
        <div className="p-3">
          {filteredTodos.length === 0 ? (
            <EmptyState
              isDark={isDark}
              hasCompletedTasks={hasEverHadTasks}
              isTodayView={filter === 'today' && rootTodos.length > 0}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTodos.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1">
                  {filteredTodos.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggle}
                      onToggleToday={toggleToday}
                      onUpdate={updateTodo}
                      onDelete={deleteTodo}
                      isDark={isDark}
                      isNew={todo.id === newTodoId}
                      categories={categories}
                      getCategoryColor={getCategoryColor}
                      subtasks={getSubtasks(todo.id)}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onUpdateSubtask={updateTodo}
                      onDeleteSubtask={deleteSubtask}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Footer - clickable for stats */}
        <button
          onClick={() => setShowStatsModal(true)}
          className={`
            w-full px-4 sm:px-6 py-4 text-xs text-center
            border-t cursor-pointer
            transition-colors
            ${isDark
              ? 'border-void-700 text-void-500 hover:text-void-400 hover:bg-void-800/50'
              : 'border-void-200 text-void-400 hover:text-void-500 hover:bg-void-50'
            }
          `}
        >
          {rootTodos.length > 0 ? (
            <span>{rootTodos.filter(t => t.completed).length} of {rootTodos.length} completed</span>
          ) : null}
          {stats.totalCompleted > 0 && (
            <span className={rootTodos.length > 0 ? ' · ' : ''}>
              {stats.totalCompleted.toLocaleString()} task{stats.totalCompleted !== 1 ? 's' : ''} all time
              {stats.streak > 1 && (
                <span className={isDark ? 'text-ember-500' : 'text-ember-600'}>
                  {' '} · {stats.streak} day streak
                </span>
              )}
            </span>
          )}
          {stats.totalCompleted === 0 && rootTodos.length === 0 && (
            <span>Complete tasks to track progress</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;
