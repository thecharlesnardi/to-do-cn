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
import { TodoInput } from './components/TodoInput';
import { TodoItem } from './components/TodoItem';
import { TodoFilters } from './components/TodoFilters';
import { EmptyState } from './components/EmptyState';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { DateTimeHeader } from './components/DateTimeHeader';
import { Confetti } from './components/Confetti';
import { BackgroundOrbs } from './components/BackgroundOrbs';

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
      {/* Background Depth Layer - orbs for glass to blur */}
      <BackgroundOrbs isDark={isDark} />

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
        onThemeToggle={toggleTheme}
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

      {/* Main Container - Glass Panel */}
      <div
        className={`
          relative w-full max-w-lg
          rounded-2xl
          border
          glass-panel
          transition-all duration-300
          ${isDark
            ? 'bg-void-900/60 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
            : 'bg-white/60 border-void-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
          }
        `}
      >
        {/* Two-Column Header */}
        <div className="flex items-start px-4 sm:px-6 pt-4 pb-2">
          {/* Left Column - Title and Count (1/3 width) */}
          <div className="w-1/3 flex flex-col justify-center">
            <h1
              className={`
                text-3xl sm:text-4xl font-semibold tracking-tight
                ${isDark ? 'text-void-50' : 'text-void-900'}
              `}
            >
              Tasks
            </h1>
            {rootTodos.length > 0 && (
              <span className="text-sm mt-1 text-anthropic-blue">
                {rootTodos.filter(t => !t.completed).length} remaining
              </span>
            )}
          </div>

          {/* Right Column - Clock and Date (2/3 width) */}
          <div className="w-2/3">
            <DateTimeHeader
              timezone={settings.timezone}
              use24Hour={settings.use24Hour}
              isDark={isDark}
            />
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
        <div className={`mx-4 sm:mx-6 h-px ${isDark ? 'bg-white/10' : 'bg-void-300/30'}`} />

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

        {/* Footer with stats and settings */}
        <div
          className={`
            relative flex items-center justify-center
            w-full px-4 sm:px-6 py-4 text-xs
            border-t rounded-b-2xl
            ${isDark ? 'border-white/5' : 'border-void-200/50'}
          `}
        >
          {/* Stats - clickable */}
          <button
            onClick={() => setShowStatsModal(true)}
            className={`
              cursor-pointer transition-colors
              ${isDark
                ? 'text-void-500 hover:text-void-400'
                : 'text-void-400 hover:text-void-500'
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

          {/* Settings gear - right side */}
          <button
            onClick={() => setShowSettingsModal(true)}
            aria-label="Settings"
            className={`
              absolute right-4 p-2 rounded-full
              transition-all duration-200 cursor-pointer
              ${isDark
                ? 'text-void-500 hover:text-void-300 hover:bg-white/5'
                : 'text-void-400 hover:text-void-600 hover:bg-black/5'
              }
            `}
          >
            <Gear size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
