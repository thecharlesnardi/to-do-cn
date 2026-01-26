import { useState, useEffect, useCallback } from 'react';

const SETTINGS_KEY = 'todo-settings';

interface Settings {
  soundEnabled: boolean;
}

const defaultSettings: Settings = {
  soundEnabled: false,
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

  return {
    settings,
    toggleSound,
  };
}
