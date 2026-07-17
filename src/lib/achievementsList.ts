import { Habit, DailyLog, Achievement } from '../types';

export const INITIAL_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt' | 'currentValue' | 'progress'>[] = [
  {
    id: 'first_habit',
    title: 'First Step',
    description: 'Complete your first habit log.',
    icon: 'Sparkles',
    target: 1
  },
  {
    id: 'streak_7',
    title: 'Week on Fire',
    description: 'Achieve a 7-day streak on any active habit.',
    icon: 'Flame',
    target: 7
  },
  {
    id: 'streak_30',
    title: 'Unstoppable Momentum',
    description: 'Achieve a 30-day streak on any active habit.',
    icon: 'Zap',
    target: 30
  },
  {
    id: 'total_completions_100',
    title: 'Century Club',
    description: 'Reach 100 total habit completions.',
    icon: 'Award',
    target: 100
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete 100% of your habits for a whole week.',
    icon: 'CalendarDays',
    target: 1
  },
  {
    id: 'perfect_month',
    title: 'Legendary Month',
    description: 'Complete 100% of your habits for a whole calendar month.',
    icon: 'Trophy',
    target: 1
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Log a habit completion before 8:00 AM.',
    icon: 'Sun',
    target: 1
  },
  {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Log a habit completion after 9:00 PM.',
    icon: 'Moon',
    target: 1
  },
  {
    id: 'consistency_master',
    title: 'Consistency Master',
    description: 'Maintain over 90% consistency score for at least 14 days.',
    icon: 'Crown',
    target: 1
  }
];

export function calculateAchievements(
  habits: Habit[],
  logs: DailyLog[],
  streaks: { longestStreak: number; currentStreak: number },
  habitStreaks: Record<string, { longest: number; current: number }>,
  overallCompletionPercent: number
): Achievement[] {
  const completedLogs = logs.filter(l => l.completed);
  const totalCompletedCount = completedLogs.length;

  // Find max streak of any single habit
  let maxHabitStreak = 0;
  Object.values(habitStreaks).forEach(s => {
    if (s.longest > maxHabitStreak) maxHabitStreak = s.longest;
  });

  // Early bird check: Completed log before 8 AM
  const hasEarlyBird = completedLogs.some(log => {
    if (!log.completedAt) return false;
    const date = new Date(log.completedAt);
    return date.getHours() < 8;
  });

  // Night owl check: Completed log after 9 PM (21:00)
  const hasNightOwl = completedLogs.some(log => {
    if (!log.completedAt) return false;
    const date = new Date(log.completedAt);
    return date.getHours() >= 21;
  });

  // Perfect weeks check: Group logs by date, see if all active habits on those days are completed.
  // We check if there's any calendar week (Mon-Sun or 7-day windows) with 100% completion
  // Let's implement a robust calculation.
  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, DailyLog[]>);

  // We find active habits on each date
  // Since habits can be created/archived, let's look at dates where there's at least one active habit
  // A simple approximation: check if we have any 7 consecutive days where completion rate is 100%
  // Let's sort dates
  const dates = Object.keys(logsByDate).sort();
  let perfectWeeksCount = 0;
  let perfectMonthsCount = 0;

  // Let's search for perfect weeks and months
  // If we have less than 7 days tracked, perfect week is 0.
  if (dates.length >= 7) {
    // Check overlapping 7-day windows
    for (let i = 0; i <= dates.length - 7; i++) {
      let isPerfectWindow = true;
      for (let j = 0; j < 7; j++) {
        const d = dates[i + j];
        const dayLogs = logsByDate[d] || [];
        // Check if there's at least one habit tracked, and all tracked logs for that day are completed.
        const totalLogged = dayLogs.length;
        const completedLogged = dayLogs.filter(l => l.completed).length;
        if (totalLogged === 0 || completedLogged < totalLogged) {
          isPerfectWindow = false;
          break;
        }
      }
      if (isPerfectWindow) {
        perfectWeeksCount = 1;
        break; // Unlock perfect week
      }
    }
  }

  // Perfect Month: Similar but for 30 consecutive days (or calendar month).
  if (dates.length >= 30) {
    for (let i = 0; i <= dates.length - 30; i++) {
      let isPerfectWindow = true;
      for (let j = 0; j < 30; j++) {
        const d = dates[i + j];
        const dayLogs = logsByDate[d] || [];
        const totalLogged = dayLogs.length;
        const completedLogged = dayLogs.filter(l => l.completed).length;
        if (totalLogged === 0 || completedLogged < totalLogged) {
          isPerfectWindow = false;
          break;
        }
      }
      if (isPerfectWindow) {
        perfectMonthsCount = 1;
        break; // Unlock perfect month
      }
    }
  }

  // Consistency Master: consistency score >= 90% and tracked >= 14 days
  const activeHabitsCount = habits.filter(h => h.active).length;
  const totalTrackedDays = dates.length;
  const isConsistencyMaster = totalTrackedDays >= 14 && overallCompletionPercent >= 90;

  return INITIAL_ACHIEVEMENTS.map(ach => {
    let currentValue = 0;
    let unlockedAt: string | null = null;

    switch (ach.id) {
      case 'first_habit':
        currentValue = totalCompletedCount >= 1 ? 1 : 0;
        break;
      case 'streak_7':
        currentValue = maxHabitStreak;
        break;
      case 'streak_30':
        currentValue = maxHabitStreak;
        break;
      case 'total_completions_100':
        currentValue = totalCompletedCount;
        break;
      case 'perfect_week':
        currentValue = perfectWeeksCount;
        break;
      case 'perfect_month':
        currentValue = perfectMonthsCount;
        break;
      case 'early_bird':
        currentValue = hasEarlyBird ? 1 : 0;
        break;
      case 'night_owl':
        currentValue = hasNightOwl ? 1 : 0;
        break;
      case 'consistency_master':
        currentValue = isConsistencyMaster ? 1 : 0;
        break;
    }

    const progress = Math.min(100, Math.round((currentValue / ach.target) * 100));
    const isUnlocked = currentValue >= ach.target;

    if (isUnlocked) {
      // For now, we can use today's timestamp as unlockedAt
      unlockedAt = new Date().toISOString();
    }

    return {
      ...ach,
      currentValue,
      progress,
      unlockedAt
    };
  });
}
