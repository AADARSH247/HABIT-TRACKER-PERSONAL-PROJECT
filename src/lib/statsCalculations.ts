import { Habit, DailyLog } from '../types';

// Helper to format Date to YYYY-MM-DD in local time
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate streaks for a set of dates where at least one habit was completed
export function calculateOverallStreaks(logs: DailyLog[]): { currentStreak: number; longestStreak: number } {
  const completedDates = Array.from(
    new Set(
      logs
        .filter(log => log.completed)
        .map(log => log.date)
    )
  ).sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Find longest streak in sorted list of completed dates
  let longestStreak = 0;
  let currentRunningStreak = 0;
  let prevDate: Date | null = null;

  const parsedDates = completedDates.map(d => new Date(d + 'T00:00:00'));

  parsedDates.forEach(date => {
    if (!prevDate) {
      currentRunningStreak = 1;
    } else {
      const diffTime = Math.abs(date.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRunningStreak += 1;
      } else if (diffDays > 1) {
        if (currentRunningStreak > longestStreak) {
          longestStreak = currentRunningStreak;
        }
        currentRunningStreak = 1;
      }
    }
    prevDate = date;
  });

  if (currentRunningStreak > longestStreak) {
    longestStreak = currentRunningStreak;
  }

  // Calculate current streak (ending today or yesterday)
  const todayStr = formatDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  const hasCompletedToday = completedDates.includes(todayStr);
  const hasCompletedYesterday = completedDates.includes(yesterdayStr);

  let currentStreak = 0;
  if (hasCompletedToday || hasCompletedYesterday) {
    // Start tracing backwards from the latest completed date (either today or yesterday)
    let checkDate = hasCompletedToday ? new Date() : yesterday;
    let checkDateStr = formatDateString(checkDate);

    while (completedDates.includes(checkDateStr)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = formatDateString(checkDate);
    }
  }

  return { currentStreak, longestStreak };
}

// Calculate streaks for a single habit
export function calculateHabitStreaks(habitId: string, logs: DailyLog[]): { current: number; longest: number } {
  const habitLogs = logs
    .filter(log => log.habitId === habitId && log.completed)
    .map(log => log.date)
    .sort();

  if (habitLogs.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 0;
  let currentRunning = 0;
  let prevDate: Date | null = null;

  const parsedDates = habitLogs.map(d => new Date(d + 'T00:00:00'));

  parsedDates.forEach(date => {
    if (!prevDate) {
      currentRunning = 1;
    } else {
      const diffTime = Math.abs(date.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRunning += 1;
      } else if (diffDays > 1) {
        if (currentRunning > longest) {
          longest = currentRunning;
        }
        currentRunning = 1;
      }
    }
    prevDate = date;
  });

  if (currentRunning > longest) {
    longest = currentRunning;
  }

  const todayStr = formatDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateString(yesterday);

  const hasCompletedToday = habitLogs.includes(todayStr);
  const hasCompletedYesterday = habitLogs.includes(yesterdayStr);

  let current = 0;
  if (hasCompletedToday || hasCompletedYesterday) {
    let checkDate = hasCompletedToday ? new Date() : yesterday;
    let checkDateStr = formatDateString(checkDate);

    while (habitLogs.includes(checkDateStr)) {
      current += 1;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = formatDateString(checkDate);
    }
  }

  return { current, longest };
}

// Calculate productivity score and letter grade
export interface ProductivityScore {
  score: number; // 0 to 100
  grade: string; // A+, A, B, C, D, F
}

export function calculateProductivityScore(habits: Habit[], logs: DailyLog[]): ProductivityScore {
  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0) {
    return { score: 0, grade: 'F' };
  }

  const todayStr = formatDateString(new Date());
  const completedToday = logs.filter(l => l.date === todayStr && l.completed).length;
  const totalActive = activeHabits.length;

  const score = Math.round((completedToday / totalActive) * 100);

  let grade = 'F';
  if (score >= 97) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 50) grade = 'D';

  return { score, grade };
}

// Calculate consistency percentage (overall completion percentage across all logs)
export function calculateConsistency(habits: Habit[], logs: DailyLog[]): number {
  const activeHabits = habits.filter(h => h.active);
  if (activeHabits.length === 0 || logs.length === 0) return 0;

  // Total possible logs is the number of active habits times the number of unique days tracked
  const uniqueDates = Array.from(new Set(logs.map(l => l.date)));
  if (uniqueDates.length === 0) return 0;

  // Let's count actual completed logs vs total expected logs
  const totalCompleted = logs.filter(l => l.completed).length;
  const totalPossible = activeHabits.length * uniqueDates.length;

  if (totalPossible === 0) return 0;
  return Math.round((totalCompleted / totalPossible) * 100);
}

// Calculate statistics for charts
export function getChartData(habits: Habit[], logs: DailyLog[]) {
  // Sort logs by date
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const uniqueDates = Array.from(new Set(sortedLogs.map(l => l.date))).slice(-14); // Last 14 days

  // 1. Daily Completion Line Chart Data
  const dailyCompletionData = uniqueDates.map(date => {
    const dayLogs = logs.filter(l => l.date === date);
    const completed = dayLogs.filter(l => l.completed).length;
    const total = habits.filter(h => h.active && h.startDate <= date).length || 1;
    return {
      date: date.substring(5), // MM-DD
      rate: Math.round((completed / total) * 100)
    };
  });

  // 2. Weekly Progress Bar Chart Data (Last 4 weeks)
  const weeklyData = [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * oneDayMs);
    const weekStart = new Date(weekEnd.getTime() - 6 * oneDayMs);
    const startStr = formatDateString(weekStart);
    const endStr = formatDateString(weekEnd);

    const weekLogs = logs.filter(l => l.date >= startStr && l.date <= endStr);
    const completed = weekLogs.filter(l => l.completed).length;
    const total = (habits.filter(h => h.active).length * 7) || 1;

    weeklyData.push({
      name: `Week -${i}`,
      completions: completed,
      rate: Math.round((completed / total) * 100)
    });
  }

  // 3. Category Distribution Pie Chart
  const categories = Array.from(new Set(habits.map(h => h.category)));
  const categoryData = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    const catHabitIds = catHabits.map(h => h.id);
    const catCompleted = logs.filter(l => catHabitIds.includes(l.habitId) && l.completed).length;

    return {
      name: cat,
      value: catCompleted,
      color: catHabits[0]?.color || '#3b82f6'
    };
  }).filter(c => c.value > 0);

  // 4. Habit Success Rate
  const habitSuccessData = habits.filter(h => h.active).map(habit => {
    const habitLogs = logs.filter(l => l.habitId === habit.id);
    const completed = habitLogs.filter(l => l.completed).length;
    const total = habitLogs.length || 1;

    return {
      name: habit.name,
      rate: Math.round((completed / total) * 100),
      color: habit.color
    };
  }).sort((a, b) => b.rate - a.rate);

  return {
    dailyCompletionData,
    weeklyData,
    categoryData,
    habitSuccessData
  };
}

// Generate smart insights
export function generateSmartInsights(habits: Habit[], logs: DailyLog[]): string[] {
  const insights: string[] = [];
  if (habits.length === 0 || logs.length === 0) {
    return ["Add some habits and complete them to generate smart insights!"];
  }

  // Group completed logs by day of the week
  const weekdayCompletions = Array(7).fill(0);
  const weekdayTotals = Array(7).fill(0);

  logs.forEach(log => {
    const date = new Date(log.date + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    weekdayTotals[dayOfWeek]++;
    if (log.completed) {
      weekdayCompletions[dayOfWeek]++;
    }
  });

  const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Find best and worst day of week
  let bestDayIndex = 0;
  let worstDayIndex = 0;
  let maxRate = 0;
  let minRate = 101;

  for (let i = 0; i < 7; i++) {
    if (weekdayTotals[i] > 0) {
      const rate = (weekdayCompletions[i] / weekdayTotals[i]) * 100;
      if (rate > maxRate) {
        maxRate = rate;
        bestDayIndex = i;
      }
      if (rate < minRate) {
        minRate = rate;
        worstDayIndex = i;
      }
    }
  }

  if (maxRate > 0) {
    insights.push(`You are most productive on ${daysOfWeekNames[bestDayIndex]}s, with a ${Math.round(maxRate)}% completion rate.`);
  }
  
  if (minRate < 100 && minRate < maxRate) {
    // If weekend (0 or 6) is the worst
    if (worstDayIndex === 0 || worstDayIndex === 6) {
      insights.push(`You miss habits mostly on weekends (${daysOfWeekNames[worstDayIndex]}s have your lowest completion rate of ${Math.round(minRate)}%).`);
    } else {
      insights.push(`Your completion dips on ${daysOfWeekNames[worstDayIndex]}s, hitting a low of ${Math.round(minRate)}%.`);
    }
  }

  // Category success rates
  const categories = Array.from(new Set(habits.map(h => h.category)));
  let bestCategory = '';
  let bestCategoryRate = 0;

  categories.forEach(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    const catHabitIds = catHabits.map(h => h.id);
    const catLogs = logs.filter(l => catHabitIds.includes(l.habitId));
    const completed = catLogs.filter(l => l.completed).length;
    const total = catLogs.length;

    if (total > 5) {
      const rate = (completed / total) * 100;
      if (rate > bestCategoryRate) {
        bestCategoryRate = rate;
        bestCategory = cat;
      }
    }
  });

  if (bestCategoryRate > 70) {
    insights.push(`Consistency master! You completed ${Math.round(bestCategoryRate)}% of your "${bestCategory}" habits.`);
  }

  // Time of day insights (morning vs evening)
  const completedLogs = logs.filter(l => l.completed && l.completedAt);
  if (completedLogs.length > 5) {
    const morningCompletions = completedLogs.filter(log => {
      const date = new Date(log.completedAt!);
      return date.getHours() < 12;
    }).length;
    
    const morningPercent = Math.round((morningCompletions / completedLogs.length) * 100);
    if (morningPercent >= 60) {
      insights.push(`You are a Morning Person! ${morningPercent}% of your habits are checked off before noon.`);
    } else if (morningPercent <= 30) {
      insights.push(`You are a Night Owl! Most of your habits are checked off in the afternoon and evening.`);
    }
  }

  // General encouragement
  if (insights.length === 0) {
    insights.push("You're establishing a solid foundation. Keep logging habits to unlock detailed analytics!");
  }

  return insights;
}
