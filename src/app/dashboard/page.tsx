'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { getRandomQuote } from '../../lib/quotes';
import { 
  calculateOverallStreaks, 
  calculateProductivityScore, 
  calculateConsistency, 
  formatDateString 
} from '../../lib/statsCalculations';
import { 
  Flame, 
  CheckCircle2, 
  CalendarDays, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  Clock, 
  Award,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../../components/Confetti';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    habits, 
    logs, 
    toggleHabitCompletion, 
    isLoading: storeLoading, 
    initStore 
  } = useHabitStore();

  const [quote, setQuote] = useState({ text: '', author: '' });
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    initStore();
    setQuote(getRandomQuote());

    // Setup Date and Clock
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [initStore]);

  // Loading skeleton
  if (authLoading || storeLoading || !user) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse col-span-2" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  // Filter out active habits
  const activeHabits = habits.filter((h) => h.active);
  const todayStr = formatDateString(new Date());

  // Calculate statistics
  const completedTodayLogs = logs.filter((l) => l.date === todayStr && l.completed);
  const completedTodayCount = completedTodayLogs.length;
  
  // A habit is considered "remaining" today if it's active and not completed today
  const completedTodayIds = completedTodayLogs.map(l => l.habitId);
  const remainingHabits = activeHabits.filter(h => !completedTodayIds.includes(h.id));
  
  // Overall statistics calculations
  const { currentStreak, longestStreak } = calculateOverallStreaks(logs);
  const { score: productivityScore, grade: productivityGrade } = calculateProductivityScore(habits, logs);
  const consistencyPercent = calculateConsistency(habits, logs);

  const totalActiveCount = activeHabits.length;
  const completionPercent = totalActiveCount > 0 
    ? Math.round((completedTodayCount / totalActiveCount) * 100) 
    : 0;

  // Handles completion logging
  const handleToggle = async (habitId: string) => {
    const isNewUnlock = await toggleHabitCompletion(habitId, todayStr);
    
    // Play confetti sound/effect on perfect day (100% completion)
    const newLogs = useHabitStore.getState().logs;
    const completedCount = newLogs.filter((l) => l.date === todayStr && l.completed).length;
    
    if (completedCount === totalActiveCount && totalActiveCount > 0) {
      triggerConfetti();
    }
  };

  // Helper Greeting Message based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // SVG Progress circle config
  const circleRadius = 50;
  const circleCircumference = circleRadius * 2 * Math.PI;
  const strokeDashoffset = circleCircumference - (completionPercent / 100) * circleCircumference;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-spin-slow" /> Dashboard Cockpit
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            {getGreeting()}, {user.displayName || 'Achiever'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consistency builds habits. Small adjustments lead to large outcomes.
          </p>
        </div>

        {/* CLOCK & DATE BAR */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <Clock className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-none">
              {currentTime || '--:--:--'}
            </p>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              {currentDate || 'Loading date...'}
            </span>
          </div>
        </div>
      </div>

      {/* DOCK HIGHLIGHT ROW: MOTIVATION & OVERALL PROGRESS RING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-tr from-accent/10 to-accent-hover/5 border border-accent/10 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="z-10">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Thought of the Day</span>
            <p className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 italic leading-relaxed mt-2.5">
              "{quote.text}"
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-400 text-right mt-4 z-10">— {quote.author}</p>
        </div>

        {/* Overall Completion animated ring */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Today's Completion
            </h4>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {completionPercent}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedTodayCount} of {totalActiveCount} habits done
            </p>
          </div>

          <div className="relative flex items-center justify-center w-28 h-28">
            <svg width="120" height="120" className="transform -rotate-90">
              {/* Background Ring */}
              <circle
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r={circleRadius}
                cx="60"
                cy="60"
              />
              {/* Animated Progress Ring */}
              <circle
                className="text-accent transition-all duration-500 ease-out"
                strokeWidth="10"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={circleRadius}
                cx="60"
                cy="60"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-5 h-5 text-accent animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* METRICS GRID CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Current Streak */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Streak</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {currentStreak} <span className="text-xs sm:text-sm font-semibold text-slate-400">days</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Keep it burning</p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Longest Streak</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {longestStreak} <span className="text-xs sm:text-sm font-semibold text-slate-400">days</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Your personal record</p>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Productivity Score</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                {productivityScore}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Score today</p>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-500 bg-blue-500/5 px-2.5 py-0.5 rounded-xl border border-blue-500/10">
              {productivityGrade}
            </div>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Consistency</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
              {consistencyPercent}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">All-time success rate</p>
          </div>
        </div>
      </div>

      {/* TODAY'S HABITS CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Today's Habit Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check off habits completed today.
              </p>
            </div>
            <button
              onClick={() => router.push('/tracker')}
              className="text-xs font-bold text-accent flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              Open 3-Month Matrix
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {activeHabits.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-400/80 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-semibold">No habits created yet!</p>
                <button
                  onClick={() => router.push('/habits?action=new')}
                  className="mt-3 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition"
                >
                  Create Your First Habit
                </button>
              </div>
            ) : (
              activeHabits.map((habit) => {
                const isCompleted = completedTodayIds.includes(habit.id);
                return (
                  <div key={habit.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl text-lg shadow-sm"
                        style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                      >
                        {habit.icon || '🎯'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold transition-all ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {habit.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span
                            className="px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                          >
                            {habit.category}
                          </span>
                          <span>•</span>
                          <span>{habit.priority} priority</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(habit.id)}
                      className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-gradient-to-tr from-accent to-accent-hover border-transparent text-white shadow-md shadow-accent/15'
                          : 'border-slate-200 dark:border-slate-800 hover:border-accent hover:bg-accent/5 text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SIDE PANELS: COMPLETED BADGES PREVIEW & INSIGHTS */}
        <div className="space-y-6">
          {/* Daily progress rings preview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Habit Progress Ring Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Today</span>
                <span className="text-lg font-black text-accent">{completionPercent}%</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Consistency</span>
                <span className="text-lg font-black text-emerald-500">{consistencyPercent}%</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/stats')}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300 transition"
            >
              Analyze in Stats
            </button>
          </div>

          {/* Quick Shortcuts Tips */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
              <Info className="w-4 h-4 text-accent" />
              <span>Keyboard Shortcuts</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use keyboard keys to navigate: <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[9px]">g</kbd>+<kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[9px]">m</kbd> for Matrix grid, <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[9px]">g</kbd>+<kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[9px]">h</kbd> for Habits manager, or press <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border rounded text-[9px] font-extrabold">?</kbd> to view all shortcuts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
