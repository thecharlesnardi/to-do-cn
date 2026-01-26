import { useState, useEffect } from 'react';

interface DateTimeHeaderProps {
  timezone: string;
  use24Hour: boolean;
  isDark: boolean;
}

/**
 * Prominent date/time header with large clock
 * Updates every minute (hours:minutes only)
 */
export function DateTimeHeader({ timezone, use24Hour, isDark }: DateTimeHeaderProps) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update time every minute
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());

    // Calculate ms until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Set initial timeout to sync with minute boundary
    const initialTimeout = setTimeout(() => {
      updateTime();
      // Then update every minute
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  // Format time digits only (without AM/PM)
  const timeDigits = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
    timeZone: timezone,
  }).replace(/\s?(AM|PM)$/i, '');

  // Get AM/PM period separately (only for 12-hour format)
  const period = use24Hour ? '' : currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
    timeZone: timezone,
  }).slice(-2);

  // Format date
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  return (
    <div className="text-right">
      <div className="flex items-baseline justify-end gap-1">
        <span
          className={`
            text-5xl sm:text-6xl font-bold tracking-tight
            tabular-nums
            ${isDark ? 'text-void-50' : 'text-void-900'}
          `}
        >
          {timeDigits}
        </span>
        {period && (
          <span className="text-xs font-semibold text-anthropic-red">
            {period}
          </span>
        )}
      </div>
      <div
        className={`
          text-sm mt-1
          ${isDark ? 'text-ember-500' : 'text-ember-600'}
        `}
      >
        {formattedDate}
      </div>
    </div>
  );
}
