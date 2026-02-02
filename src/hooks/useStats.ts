import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

interface DailyCount {
  [date: string]: number
}

interface Stats {
  totalCompleted: number
  streak: number
  lastCompleteDate: string | null
  bestStreak: number
  dailyCounts: DailyCount
}

const defaultStats: Stats = {
  totalCompleted: 0,
  streak: 0,
  lastCompleteDate: null,
  bestStreak: 0,
  dailyCounts: {},
}

// Milestone thresholds for celebrations
const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000]

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterday(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek
  const weekStart = new Date(now.setDate(diff))
  return weekStart.toISOString().split('T')[0]
}

/**
 * Custom hook for tracking completion statistics with Supabase persistence
 */
export function useStats(userId: string | undefined) {
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [justHitMilestone, setJustHitMilestone] = useState<number | null>(null)

  // Fetch stats from Supabase
  useEffect(() => {
    async function fetchStats() {
      if (!userId) {
        setStats(defaultStats)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          const today = getToday()
          const yesterday = getYesterday()
          let currentStreak = data.current_streak

          // Reset streak if last completion was before yesterday
          if (data.last_completion_date &&
              data.last_completion_date !== today &&
              data.last_completion_date !== yesterday) {
            currentStreak = 0
            // Update in DB
            await supabase
              .from('user_stats')
              .update({ current_streak: 0 })
              .eq('user_id', userId)
          }

          setStats({
            totalCompleted: data.total_completed,
            streak: currentStreak,
            lastCompleteDate: data.last_completion_date,
            bestStreak: data.longest_streak,
            dailyCounts: data.daily_counts || {},
          })
        } else {
          // Create default stats for new user
          await supabase.from('user_stats').insert({
            user_id: userId,
            total_completed: 0,
            current_streak: 0,
            longest_streak: 0,
            daily_counts: {},
            last_completion_date: null,
          })
          setStats(defaultStats)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  // Computed stats
  const completedToday = useMemo(() => {
    const today = getToday()
    return stats.dailyCounts[today] || 0
  }, [stats.dailyCounts])

  const completedThisWeek = useMemo(() => {
    const weekStart = getWeekStart()
    let count = 0
    for (const [date, num] of Object.entries(stats.dailyCounts)) {
      if (date >= weekStart) {
        count += num
      }
    }
    return count
  }, [stats.dailyCounts])

  const recordCompletion = useCallback(async () => {
    if (!userId) return

    const today = getToday()
    const yesterday = getYesterday()

    setStats(prev => {
      let newStreak = prev.streak

      if (prev.lastCompleteDate === today) {
        newStreak = prev.streak
      } else if (prev.lastCompleteDate === yesterday) {
        newStreak = prev.streak + 1
      } else if (prev.lastCompleteDate === null) {
        newStreak = 1
      } else {
        newStreak = 1
      }

      const newTotal = prev.totalCompleted + 1
      const newBestStreak = Math.max(prev.bestStreak, newStreak)

      // Check for milestone
      if (MILESTONES.includes(newTotal)) {
        setJustHitMilestone(newTotal)
      }

      // Update daily counts (keep last 30 days)
      const newDailyCounts = { ...prev.dailyCounts }
      newDailyCounts[today] = (newDailyCounts[today] || 0) + 1

      // Clean up old entries (older than 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const cutoff = thirtyDaysAgo.toISOString().split('T')[0]
      for (const date of Object.keys(newDailyCounts)) {
        if (date < cutoff) {
          delete newDailyCounts[date]
        }
      }

      // Update in database (fire and forget with error logging)
      supabase
        .from('user_stats')
        .update({
          total_completed: newTotal,
          current_streak: newStreak,
          longest_streak: newBestStreak,
          daily_counts: newDailyCounts,
          last_completion_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .then(() => {})
        .catch(err => console.error('Failed to update stats:', err))

      return {
        totalCompleted: newTotal,
        streak: newStreak,
        lastCompleteDate: today,
        bestStreak: newBestStreak,
        dailyCounts: newDailyCounts,
      }
    })
  }, [userId])

  const clearMilestone = useCallback(() => {
    setJustHitMilestone(null)
  }, [])

  const resetStats = useCallback(async () => {
    if (!userId) return

    setStats(defaultStats)

    try {
      await supabase
        .from('user_stats')
        .update({
          total_completed: 0,
          current_streak: 0,
          longest_streak: 0,
          daily_counts: {},
          last_completion_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } catch (err) {
      console.error('Failed to reset stats:', err)
    }
  }, [userId])

  return {
    stats,
    loading,
    completedToday,
    completedThisWeek,
    recordCompletion,
    justHitMilestone,
    clearMilestone,
    resetStats,
  }
}
