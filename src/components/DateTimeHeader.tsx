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

  // Format time based on settings
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
    timeZone: timezone,
  });

  // Format date
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  return (
    <div className="text-center py-4">
      <div
        className={`
          text-4xl sm:text-5xl font-bold tracking-tight
          tabular-nums
          ${isDark ? 'text-void-50' : 'text-void-900'}
        `}
      >
        {formattedTime}
      </div>
      <div
        className={`
          text-sm mt-1
          ${isDark ? 'text-void-400' : 'text-void-500'}
        `}
      >
        {formattedDate}
      </div>
    </div>
  );
}
