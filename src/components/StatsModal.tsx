import { X, TrendUp, Fire, Trophy, Calendar } from '@phosphor-icons/react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  completedToday: number;
  completedThisWeek: number;
  totalCompleted: number;
  streak: number;
  bestStreak: number;
}

export function StatsModal({
  isOpen,
  onClose,
  isDark,
  completedToday,
  completedThisWeek,
  totalCompleted,
  streak,
  bestStreak,
}: StatsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 modal-backdrop ${isDark ? 'bg-black/70' : 'bg-black/50'}`} />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-sm rounded-2xl p-6 modal-content
          ${isDark
            ? 'bg-void-800 border border-void-700'
            : 'bg-white border border-void-200'
          }
          shadow-2xl
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4 p-2 rounded-lg
            transition-colors cursor-pointer
            ${isDark
              ? 'text-void-400 hover:text-void-200 hover:bg-void-700'
              : 'text-void-500 hover:text-void-700 hover:bg-void-100'
            }
          `}
        >
          <X size={20} weight="bold" />
        </button>

        {/* Title */}
        <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-void-50' : 'text-void-900'}`}>
          Your Progress
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today */}
          <StatCard
            icon={<Calendar size={24} weight="duotone" />}
            label="Today"
            value={completedToday}
            isDark={isDark}
          />

          {/* This Week */}
          <StatCard
            icon={<TrendUp size={24} weight="duotone" />}
            label="This Week"
            value={completedThisWeek}
            isDark={isDark}
          />

          {/* Current Streak */}
          <StatCard
            icon={<Fire size={24} weight="duotone" />}
            label="Streak"
            value={streak}
            suffix={streak === 1 ? ' day' : ' days'}
            highlight={streak > 0}
            isDark={isDark}
          />

          {/* Best Streak */}
          <StatCard
            icon={<Trophy size={24} weight="duotone" />}
            label="Best Streak"
            value={bestStreak}
            suffix={bestStreak === 1 ? ' day' : ' days'}
            isDark={isDark}
          />
        </div>

        {/* All Time Total */}
        <div
          className={`
            mt-6 pt-6 border-t text-center
            ${isDark ? 'border-void-700' : 'border-void-200'}
          `}
        >
          <p className={`text-sm ${isDark ? 'text-void-400' : 'text-void-500'}`}>
            All Time
          </p>
          <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-ember-500' : 'text-ember-600'}`}>
            {totalCompleted.toLocaleString()}
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-void-400' : 'text-void-500'}`}>
            tasks completed
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
  isDark: boolean;
}

function StatCard({ icon, label, value, suffix = '', highlight, isDark }: StatCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl
        ${isDark ? 'bg-void-700/50' : 'bg-void-50'}
      `}
    >
      <div className={`mb-2 ${highlight ? (isDark ? 'text-ember-500' : 'text-ember-600') : (isDark ? 'text-void-400' : 'text-void-500')}`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${isDark ? 'text-void-100' : 'text-void-800'}`}>
        {value.toLocaleString()}{suffix}
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-void-500' : 'text-void-400'}`}>
        {label}
      </p>
    </div>
  );
}
