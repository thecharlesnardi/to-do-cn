import { Sparkle, CheckCircle, Star } from '@phosphor-icons/react';

interface EmptyStateProps {
  isDark: boolean;
  hasCompletedTasks?: boolean;
  isTodayView?: boolean;
}

/**
 * Displayed when no todos exist
 * Shows different messages based on context:
 * - New user: encouraging to get started
 * - All tasks completed: celebration message
 */
export function EmptyState({ isDark, hasCompletedTasks, isTodayView }: EmptyStateProps) {
  // If in Today view with no starred tasks, show different message
  if (isTodayView) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div
          className={`
            p-4 rounded-full mb-4
            ${isDark ? 'bg-void-800' : 'bg-void-100'}
          `}
        >
          <Star
            size={32}
            weight="duotone"
            className={`${isDark ? 'text-ember-500' : 'text-ember-600'} empty-state-icon`}
          />
        </div>
        <p
          className={`
            text-center text-base font-medium mb-1
            ${isDark ? 'text-void-200' : 'text-void-700'}
          `}
        >
          No tasks for today
        </p>
        <p
          className={`
            text-center text-sm
            ${isDark ? 'text-void-500' : 'text-void-400'}
          `}
        >
          Star tasks to add them here.
        </p>
      </div>
    );
  }

  // If user completed all tasks, show celebration message
  if (hasCompletedTasks) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div
          className={`
            p-4 rounded-full mb-4
            ${isDark ? 'bg-ember-500/10' : 'bg-ember-500/5'}
          `}
        >
          <CheckCircle
            size={32}
            weight="duotone"
            className={`${isDark ? 'text-ember-500' : 'text-ember-600'} empty-state-icon`}
          />
        </div>
        <p
          className={`
            text-center text-base font-medium mb-1
            ${isDark ? 'text-void-200' : 'text-void-700'}
          `}
        >
          All done!
        </p>
        <p
          className={`
            text-center text-sm
            ${isDark ? 'text-void-500' : 'text-void-400'}
          `}
        >
          Enjoy your free time.
        </p>
      </div>
    );
  }

  // Default: new user, no tasks yet
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div
        className={`
          p-4 rounded-full mb-4
          ${isDark ? 'bg-void-800' : 'bg-void-100'}
        `}
      >
        <Sparkle
          size={32}
          weight="duotone"
          className={`${isDark ? 'text-ember-500' : 'text-ember-600'} empty-state-icon`}
        />
      </div>
      <p
        className={`
          text-center text-base font-medium mb-1
          ${isDark ? 'text-void-200' : 'text-void-700'}
        `}
      >
        Ready when you are
      </p>
      <p
        className={`
          text-center text-sm
          ${isDark ? 'text-void-500' : 'text-void-400'}
        `}
      >
        Add a task to get started.
      </p>
    </div>
  );
}
