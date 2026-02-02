import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Get browser's default timezone
function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Chicago'
  }
}

export interface Settings {
  soundEnabled: boolean
  timezone: string
  use24Hour: boolean
}

const defaultSettings: Settings = {
  soundEnabled: false,
  timezone: getBrowserTimezone(),
  use24Hour: false,
}

/**
 * Custom hook for managing user settings with Supabase persistence
 */
export function useSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Fetch settings from Supabase
  useEffect(() => {
    async function fetchSettings() {
      if (!userId) {
        setSettings(defaultSettings)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found (expected for new users)
          throw error
        }

        if (data) {
          setSettings({
            soundEnabled: data.sound_enabled,
            timezone: data.timezone,
            use24Hour: data.use_24_hour,
          })
        } else {
          // Create default settings for new user
          const browserTimezone = getBrowserTimezone()
          await supabase.from('user_settings').insert({
            user_id: userId,
            sound_enabled: false,
            timezone: browserTimezone,
            use_24_hour: false,
            theme: 'dark',
          })
          setSettings({ ...defaultSettings, timezone: browserTimezone })
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId])

  // Helper to update settings in DB
  const updateSettingsInDb = useCallback(async (updates: Partial<{
    sound_enabled: boolean
    timezone: string
    use_24_hour: boolean
  }>) => {
    if (!userId) return
    try {
      await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
    } catch (err) {
      console.error('Failed to update settings:', err)
    }
  }, [userId])

  const toggleSound = useCallback(() => {
    setSettings(prev => {
      const newValue = !prev.soundEnabled
      updateSettingsInDb({ sound_enabled: newValue })
      return { ...prev, soundEnabled: newValue }
    })
  }, [updateSettingsInDb])

  const setTimezone = useCallback((timezone: string) => {
    setSettings(prev => {
      updateSettingsInDb({ timezone })
      return { ...prev, timezone }
    })
  }, [updateSettingsInDb])

  const toggleTimeFormat = useCallback(() => {
    setSettings(prev => {
      const newValue = !prev.use24Hour
      updateSettingsInDb({ use_24_hour: newValue })
      return { ...prev, use24Hour: newValue }
    })
  }, [updateSettingsInDb])

  return {
    settings,
    loading,
    toggleSound,
    setTimezone,
    toggleTimeFormat,
  }
}
