import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Gear, SpinnerGap, SignOut } from '@phosphor-icons/react'
import { useAuth } from './hooks/useAuth'
import { useTheme } from './hooks/useTheme'
import { useTodos } from './hooks/useTodos'
import { useCategories } from './hooks/useCategories'
import { useStats } from './hooks/useStats'
import { useSettings } from './hooks/useSettings'
import { useSound, triggerHaptic } from './hooks/useSound'
import { Auth } from './components/Auth'
import { TodoInput } from './components/TodoInput'
import { TodoItem } from './components/TodoItem'
import { TodoFilters } from './components/TodoFilters'
import { EmptyState } from './components/EmptyState'
import { StatsModal } from './components/StatsModal'
import { SettingsModal } from './components/SettingsModal'
import { DateTimeHeader } from './components/DateTimeHeader'
import { Confetti } from './components/Confetti'
import { BackgroundOrbs } from './components/BackgroundOrbs'

function App() {
  // Auth state
  const { user, loading: authLoading, signIn, signUp, signOut, resetPassword } = useAuth()
  const userId = user?.id

  // Theme (works without auth)
  const { isDark, toggleTheme } = useTheme()

  // These hooks now require userId
  const { todos, loading: todosLoading, addTodo, toggleTodo, updateTodo, updateTodoFields, deleteTodo, reorderTodos, toggleToday, clearCompleted, clearAllTodos, addSubtask, toggleSubtask, deleteSubtask, getSubtasks, reorderSubtasks } = useTodos(userId)
  const { categories, getCategoryColor } = useCategories()
  const { stats, loading: statsLoading, completedToday, completedThisWeek, recordCompletion, justHitMilestone, clearMilestone, resetStats } = useStats(userId)
  const { settings, loading: settingsLoading, toggleSound, setTimezone, toggleTimeFormat } = useSettings(userId)
  const { playComplete } = useSound(settings.soundEnabled)

  const [filter, setFilter] = useState<'today' | 'later'>('today')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Set up drag sensors (must be before any early returns!)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-void-950' : 'bg-void-50'}`}>
        <SpinnerGap size={48} className={`animate-spin ${isDark ? 'text-ember-500' : 'text-ember-600'}`} />
      </div>
    )
  }

  // Show auth screen if not logged in
  if (!user) {
    return (
      <Auth
        onSignIn={signIn}
        onSignUp={signUp}
        onResetPassword={resetPassword}
        isDark={isDark}
      />
    )
  }

  // Show loading while data loads
  const isDataLoading = todosLoading || statsLoading || settingsLoading
  if (isDataLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-void-950' : 'bg-void-50'}`}>
        <SpinnerGap size={48} className={`animate-spin ${isDark ? 'text-ember-500' : 'text-ember-600'}`} />
        <p className={`text-sm ${isDark ? 'text-void-400' : 'text-void-500'}`}>Loading your tasks...</p>
      </div>
    )
  }

  // Wrap toggleTodo to track completions with sound and haptic
  const handleToggle = (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (todo && !todo.completed) {
      recordCompletion()
      playComplete()
      triggerHaptic()
    }
    toggleTodo(id)
  }

  // Handle category update for quick-select
  const handleUpdateCategory = (id: number, category: string | undefined) => {
    updateTodoFields(id, { category })
  }

  // Handle priority update for quick-select
  const handleUpdatePriority = (id: number, priority: 'low' | 'medium' | 'high' | undefined) => {
    updateTodoFields(id, { priority })
  }

  // Filter to root todos only (no parentId) for main list
  const rootTodos = todos.filter(t => !t.parentId)

  // Compute filtered and display todos
  const todayTodos = rootTodos.filter(t => t.isToday)
  const laterTodos = rootTodos.filter(t => !t.isToday)

  // Apply both view filter and category filter
  let filteredTodos = filter === 'today' ? todayTodos : laterTodos
  if (categoryFilter) {
    filteredTodos = filteredTodos.filter(t => t.category === categoryFilter)
  }

  const completedTodos = todos.filter(t => t.completed)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTodos(active.id as number, over.id as number)
    }
  }

  const handleClearCompleted = () => {
    clearCompleted()
    setShowSettingsModal(false)
  }

  const handleResetStats = () => {
    if (window.confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      resetStats()
      setShowSettingsModal(false)
    }
  }

  const handleSignOut = async () => {
    if (window.confirm('Sign out of your account?')) {
      await signOut()
    }
  }

  return (
    <div className="h-screen flex items-center justify-center px-4 py-4 sm:py-8">
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
          max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]
          flex flex-col
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
        <div className="flex-shrink-0 flex items-start px-4 sm:px-6 pt-4 pb-2">
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
        <div className="flex-shrink-0 p-4 sm:p-6">
          <TodoInput
            onAdd={addTodo}
            isDark={isDark}
            categories={categories}
          />
        </div>

        {/* Divider */}
        <div className={`flex-shrink-0 mx-4 sm:mx-6 h-px ${isDark ? 'bg-white/10' : 'bg-void-300/30'}`} />

        {/* Filter Toggle */}
        {rootTodos.length > 0 && (
          <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-2">
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
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          {filteredTodos.length === 0 ? (
            <EmptyState
              isDark={isDark}
              hasCompletedTasks={todos.length > 0}
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
                      onUpdateCategory={handleUpdateCategory}
                      onUpdatePriority={handleUpdatePriority}
                      isDark={isDark}
                      isNew={false}
                      categories={categories}
                      getCategoryColor={getCategoryColor}
                      subtasks={getSubtasks(todo.id)}
                      onAddSubtask={addSubtask}
                      onToggleSubtask={toggleSubtask}
                      onUpdateSubtask={updateTodo}
                      onDeleteSubtask={deleteSubtask}
                      onReorderSubtasks={reorderSubtasks}
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
            flex-shrink-0
            relative flex items-center justify-center
            w-full px-4 sm:px-6 py-4 text-xs
            border-t rounded-b-2xl
            ${isDark ? 'border-white/5' : 'border-void-200/50'}
          `}
        >
          {/* Sign out button - left side */}
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className={`
              absolute left-4 p-2 rounded-full
              transition-all duration-200 cursor-pointer
              ${isDark
                ? 'text-void-500 hover:text-void-300 hover:bg-white/5'
                : 'text-void-400 hover:text-void-600 hover:bg-black/5'
              }
            `}
          >
            <SignOut size={18} weight="bold" />
          </button>

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
  )
}

export default App
