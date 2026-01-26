import { X, SpeakerHigh, SpeakerSlash, Trash, ArrowCounterClockwise, Clock, Globe } from '@phosphor-icons/react';

// Common timezones for dropdown
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  use24Hour: boolean;
  onTimeFormatToggle: () => void;
  onClearCompleted: () => void;
  onClearAllTasks: () => void;
  onResetStats: () => void;
  completedCount: number;
  totalCount: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDark,
  soundEnabled,
  onSoundToggle,
  timezone,
  onTimezoneChange,
  use24Hour,
  onTimeFormatToggle,
  onClearCompleted,
  onClearAllTasks,
  onResetStats,
  completedCount,
  totalCount,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleClearAllTasks = () => {
    if (window.confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
      onClearAllTasks();
      onClose();
    }
  };

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
          shadow-2xl max-h-[80vh] overflow-y-auto
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
          Settings
        </h2>

        {/* Settings List */}
        <div className="space-y-4">
          {/* Sound Toggle */}
          <div
            className={`
              flex items-center justify-between p-4 rounded-xl
              ${isDark ? 'bg-void-700/50' : 'bg-void-50'}
            `}
          >
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <SpeakerHigh size={24} className={isDark ? 'text-ember-500' : 'text-ember-600'} />
              ) : (
                <SpeakerSlash size={24} className={isDark ? 'text-void-400' : 'text-void-500'} />
              )}
              <div>
                <p className={`font-medium ${isDark ? 'text-void-100' : 'text-void-800'}`}>
                  Completion Sound
                </p>
                <p className={`text-xs ${isDark ? 'text-void-500' : 'text-void-400'}`}>
                  Play sound when completing tasks
                </p>
              </div>
            </div>
            <button
              onClick={onSoundToggle}
              className={`
                relative w-12 h-6 rounded-full transition-colors cursor-pointer
                ${soundEnabled
                  ? isDark ? 'bg-ember-500' : 'bg-ember-600'
                  : isDark ? 'bg-void-600' : 'bg-void-300'
                }
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white
                  transition-transform
                  ${soundEnabled ? 'left-7' : 'left-1'}
                `}
              />
            </button>
          </div>

          {/* Timezone Selector */}
          <div
            className={`
              p-4 rounded-xl
              ${isDark ? 'bg-void-700/50' : 'bg-void-50'}
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <Globe size={24} className={isDark ? 'text-void-400' : 'text-void-500'} />
              <div>
                <p className={`font-medium ${isDark ? 'text-void-100' : 'text-void-800'}`}>
                  Timezone
                </p>
                <p className={`text-xs ${isDark ? 'text-void-500' : 'text-void-400'}`}>
                  Used for clock display
                </p>
              </div>
            </div>
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg cursor-pointer
                ${isDark
                  ? 'bg-void-600 border border-void-500 text-void-100'
                  : 'bg-white border border-void-200 text-void-800'
                }
              `}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* 12/24 Hour Toggle */}
          <div
            className={`
              flex items-center justify-between p-4 rounded-xl
              ${isDark ? 'bg-void-700/50' : 'bg-void-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <Clock size={24} className={isDark ? 'text-void-400' : 'text-void-500'} />
              <div>
                <p className={`font-medium ${isDark ? 'text-void-100' : 'text-void-800'}`}>
                  24-Hour Time
                </p>
                <p className={`text-xs ${isDark ? 'text-void-500' : 'text-void-400'}`}>
                  Use 24-hour clock format
                </p>
              </div>
            </div>
            <button
              onClick={onTimeFormatToggle}
              className={`
                relative w-12 h-6 rounded-full transition-colors cursor-pointer
                ${use24Hour
                  ? isDark ? 'bg-ember-500' : 'bg-ember-600'
                  : isDark ? 'bg-void-600' : 'bg-void-300'
                }
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white
                  transition-transform
                  ${use24Hour ? 'left-7' : 'left-1'}
                `}
              />
            </button>
          </div>

          {/* Clear Completed */}
          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className={`
                w-full flex items-center gap-3 p-4 rounded-xl
                transition-colors cursor-pointer
                ${isDark
                  ? 'bg-void-700/50 hover:bg-void-700 text-void-200'
                  : 'bg-void-50 hover:bg-void-100 text-void-700'
                }
              `}
            >
              <Trash size={24} className={isDark ? 'text-void-400' : 'text-void-500'} />
              <div className="text-left">
                <p className="font-medium">Clear Completed Tasks</p>
                <p className={`text-xs ${isDark ? 'text-void-500' : 'text-void-400'}`}>
                  Remove {completedCount} completed task{completedCount !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          )}

          {/* Clear All Tasks */}
          {totalCount > 0 && (
            <button
              onClick={handleClearAllTasks}
              className={`
                w-full flex items-center gap-3 p-4 rounded-xl
                transition-colors cursor-pointer
                ${isDark
                  ? 'bg-danger/10 hover:bg-danger/20 text-danger'
                  : 'bg-danger/5 hover:bg-danger/10 text-danger'
                }
              `}
            >
              <Trash size={24} weight="fill" />
              <div className="text-left">
                <p className="font-medium">Clear All Tasks</p>
                <p className={`text-xs opacity-70`}>
                  Delete all {totalCount} task{totalCount !== 1 ? 's' : ''} permanently
                </p>
              </div>
            </button>
          )}

          {/* Reset Stats */}
          <button
            onClick={onResetStats}
            className={`
              w-full flex items-center gap-3 p-4 rounded-xl
              transition-colors cursor-pointer
              ${isDark
                ? 'bg-void-700/50 hover:bg-void-700 text-void-300'
                : 'bg-void-50 hover:bg-void-100 text-void-600'
              }
            `}
          >
            <ArrowCounterClockwise size={24} />
            <div className="text-left">
              <p className="font-medium">Reset Statistics</p>
              <p className={`text-xs opacity-70`}>
                Clear all progress tracking data
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
