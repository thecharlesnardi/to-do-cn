import { Sparkle } from '@phosphor-icons/react';

interface EmptyStateProps {
  isDark: boolean;
}

/**
 * Displayed when no todos exist
 * Subtle, encouraging message
 */
export function EmptyState({ isDark }: EmptyStateProps) {
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
          className={isDark ? 'text-ember-500' : 'text-ember-600'}
        />
      </div>
      <p
        className={`
          text-center text-base
          ${isDark ? 'text-void-400' : 'text-void-500'}
        `}
      >
        No tasks yet. Add one to get started.
      </p>
    </div>
  );
}
