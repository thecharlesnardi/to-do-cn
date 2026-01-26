import { X, SpeakerHigh, SpeakerSlash, Trash, ArrowCounterClockwise } from '@phosphor-icons/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onClearCompleted: () => void;
  onResetStats: () => void;
  completedCount: number;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDark,
  soundEnabled,
  onSoundToggle,
  onClearCompleted,
  onResetStats,
  completedCount,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-black/50'}`} />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          relative w-full max-w-sm rounded-2xl p-6
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

          {/* Reset Stats */}
          <button
            onClick={onResetStats}
            className={`
              w-full flex items-center gap-3 p-4 rounded-xl
              transition-colors cursor-pointer
              ${isDark
                ? 'bg-danger/10 hover:bg-danger/20 text-danger'
                : 'bg-danger/5 hover:bg-danger/10 text-danger'
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
