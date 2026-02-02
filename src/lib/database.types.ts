// Database types for Supabase tables
// These match the schema we created in the database

export interface Todo {
  id: number
  user_id: string
  text: string
  completed: boolean
  is_today: boolean
  today_date: string | null
  category: string | null
  due_date: string | null
  priority: 'low' | 'medium' | 'high' | null
  parent_id: number | null
  position: number
  created_at: string
}

export interface UserSettings {
  user_id: string
  sound_enabled: boolean
  timezone: string
  use_24_hour: boolean
  theme: 'dark' | 'light'
  created_at: string
  updated_at: string
}

export interface UserStats {
  user_id: string
  total_completed: number
  current_streak: number
  longest_streak: number
  daily_counts: Record<string, number>
  last_completion_date: string | null
  created_at: string
  updated_at: string
}

// Insert types (for creating new records - without auto-generated fields)
export type TodoInsert = Omit<Todo, 'id' | 'created_at'> & {
  id?: number
  created_at?: string
}

export type UserSettingsInsert = Omit<UserSettings, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}

export type UserStatsInsert = Omit<UserStats, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}
