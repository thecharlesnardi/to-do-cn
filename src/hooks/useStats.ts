import { useState, useEffect, useCallback, useMemo } from 'react';

const STATS_KEY = 'todo-stats';

interface DailyCount {
  [date: string]: number;
}

interface Stats {
  totalCompleted: number;
  streak: number;
  lastCompleteDate: string | null;
  bestStreak: number;
  dailyCounts: DailyCount;
}

const defaultStats: Stats = {
  totalCompleted: 0,
  streak: 0,
  lastCompleteDate: null,
  bestStreak: 0,
  dailyCounts: {},
};

// Milestone thresholds for celebrations
const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

/**
 * Custom hook for tracking completion statistics
 */
export function useStats() {
  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      try {
        return { ...defaultStats, ...JSON.parse(saved) };
      } catch {
        return defaultStats;
      }
    }
    return defaultStats;
  });

  const [justHitMilestone, setJustHitMilestone] = useState<number | null>(null);

  // Persist stats to localStorage
  useEffect(() => {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  // Check and update streak on load
  useEffect(() => {
    const today = getToday();
    const yesterday = getYesterday();

    if (stats.lastCompleteDate &&
        stats.lastCompleteDate !== today &&
        stats.lastCompleteDate !== yesterday) {
      setStats(prev => ({ ...prev, streak: 0 }));
    }
  }, []);

  // Computed stats
  const completedToday = useMemo(() => {
    const today = getToday();
    return stats.dailyCounts[today] || 0;
  }, [stats.dailyCounts]);

  const completedThisWeek = useMemo(() => {
    const weekStart = getWeekStart();
    let count = 0;
    for (const [date, num] of Object.entries(stats.dailyCounts)) {
      if (date >= weekStart) {
        count += num;
      }
    }
    return count;
  }, [stats.dailyCounts]);

  const recordCompletion = useCallback(() => {
    const today = getToday();
    const yesterday = getYesterday();

    setStats(prev => {
      let newStreak = prev.streak;

      if (prev.lastCompleteDate === today) {
        newStreak = prev.streak;
      } else if (prev.lastCompleteDate === yesterday) {
        newStreak = prev.streak + 1;
      } else if (prev.lastCompleteDate === null) {
        newStreak = 1;
      } else {
        newStreak = 1;
      }

      const newTotal = prev.totalCompleted + 1;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);

      // Check for milestone
      if (MILESTONES.includes(newTotal)) {
        setJustHitMilestone(newTotal);
      }

      // Update daily counts (keep last 30 days to prevent unbounded growth)
      const newDailyCounts = { ...prev.dailyCounts };
      newDailyCounts[today] = (newDailyCounts[today] || 0) + 1;

      // Clean up old entries (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
      for (const date of Object.keys(newDailyCounts)) {
        if (date < cutoff) {
          delete newDailyCounts[date];
        }
      }

      return {
        totalCompleted: newTotal,
        streak: newStreak,
        lastCompleteDate: today,
        bestStreak: newBestStreak,
        dailyCounts: newDailyCounts,
      };
    });
  }, []);

  const clearMilestone = useCallback(() => {
    setJustHitMilestone(null);
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
    localStorage.removeItem(STATS_KEY);
  }, []);

  return {
    stats,
    completedToday,
    completedThisWeek,
    recordCompletion,
    justHitMilestone,
    clearMilestone,
    resetStats,
  };
}
