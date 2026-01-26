import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'todo-settings';

// Get browser's default timezone
function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/Chicago';
  }
}

export interface Settings {
  soundEnabled: boolean;
  timezone: string;
  use24Hour: boolean;
}

const defaultSettings: Settings = {
  soundEnabled: false,
  timezone: getBrowserTimezone(),
  use24Hour: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const setTimezone = useCallback((timezone: string) => {
    setSettings(prev => ({ ...prev, timezone }));
  }, []);

  const toggleTimeFormat = useCallback(() => {
    setSettings(prev => ({ ...prev, use24Hour: !prev.use24Hour }));
  }, []);

  return {
    settings,
    toggleSound,
    setTimezone,
    toggleTimeFormat,
  };
}
