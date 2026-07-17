'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { Habit, DailyLog } from '../../types';
import { formatDateString } from '../../lib/statsCalculations';
import { 
  CalendarDays, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerConfetti } from '../../components/Confetti';

export default function TrackerPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    habits, 
    logs, 
    toggleHabitCompletion, 
    isLoading: storeLoading 
  } = useHabitStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || storeLoading || !user) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const activeHabits = habits.filter((h) => h.active);

  // Filter habits for the grid
  const filteredHabits = activeHabits.filter((h) => {
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || h.priority === selectedPriority;
    return matchesCategory && matchesPriority;
  });

  // Calculate Month Ranges: Month 1 (2 months ago), Month 2 (1 month ago), Month 3 (Current month)
  const getThreeMonths = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(), // 0-indexed
        name: d.toLocaleString('default', { month: 'long' }),
      });
    }
    return months; // [Month-2, Month-1, Month-Current]
  };

  const threeMonths = getThreeMonths();

  // Helper to generate dates for a specific year and month
  const getDatesForMonth = (year: number, month: number) => {
    const dates = [];
    const numDays = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= numDays; day++) {
      const d = new Date(year, month, day);
      dates.push({
        dayNumber: day,
        weekdayLabel: d.toLocaleString('default', { weekday: 'narrow' }), // M, T, W...
        dateStr: formatDateString(d),
      });
    }
    return dates;
  };

  const handleCellClick = async (habitId: string, dateStr: string) => {
    // Only allow checking if date is not in the future
    const today = formatDateString(new Date());
    if (dateStr > today) {
      alert("You cannot check off habits in the future!");
      return;
    }

    const unlockedNew = await toggleHabitCompletion(habitId, dateStr);
    
    // Confetti on 100% completion today
    if (dateStr === today) {
      const activeCount = habits.filter(h => h.active).length;
      const completedTodayCount = useHabitStore.getState().logs.filter(
        l => l.date === today && l.completed
      ).length;
      
      if (completedTodayCount === activeCount && activeCount > 0) {
        triggerConfetti();
      }
    }
  };

  // Get categories for filter selection
  const categories = Array.from(new Set(activeHabits.map((h) => h.category)));

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> 90-Day Tracker
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            3-Month Habit Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Click cells to log completions. Rows represent habits, columns represent days of the month.
          </p>
        </div>

        {/* Short info badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <Info className="w-4 h-4 text-accent" />
          <span>Click once to complete, click again to uncheck.</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none text-slate-600 dark:text-slate-300 transition"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none text-slate-600 dark:text-slate-300 transition"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* GRID CONTAINER - DISPLAYS EXACTLY MONTH 1, MONTH 2, MONTH 3 */}
      {filteredHabits.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
          <p className="text-sm font-semibold">No habits matching filters or no active habits created yet.</p>
          <button
            onClick={() => router.push('/habits?action=new')}
            className="mt-3 px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-md hover:scale-102 active:scale-95 transition"
          >
            Go to Habits Manager
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {threeMonths.map((m, monthIndex) => {
            const days = getDatesForMonth(m.year, m.month);
            
            return (
              <div 
                key={`${m.year}-${m.month}`}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 overflow-hidden"
              >
                {/* Month Name and header info */}
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                    Month {monthIndex + 1}: {m.name} {m.year}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {days.length} Days
                  </span>
                </div>

                {/* MATRIX GRID BOARD - SCROLLABLE TABLE */}
                <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-track-slate-100 dark:scrollbar-track-slate-900 scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                  <div className="min-w-max">
                    <table className="w-full border-collapse">
                      {/* TABLE DAYS HEADER */}
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          {/* Top-Left empty header cell */}
                          <th className="w-44 text-left pb-3 pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-white dark:bg-slate-900 z-10">
                            Habit
                          </th>
                          {days.map((d) => {
                            const isToday = d.dateStr === formatDateString(new Date());
                            return (
                              <th 
                                key={d.dateStr}
                                className={`text-center pb-3 px-1 text-[10px] font-bold w-9 ${
                                  isToday ? 'text-accent' : 'text-slate-400'
                                }`}
                              >
                                <div>{d.weekdayLabel}</div>
                                <div className={`mt-0.5 w-6 h-6 mx-auto flex items-center justify-center rounded-lg text-[10px] font-extrabold ${
                                  isToday ? 'bg-accent/15 border border-accent/20' : ''
                                }`}>
                                  {d.dayNumber}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      {/* TABLE HABITS ROWS */}
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                        {filteredHabits.map((habit) => (
                          <tr key={habit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                            {/* Habit column header */}
                            <td className="py-3.5 pr-4 sticky left-0 bg-white dark:bg-slate-900 z-10 flex items-center gap-2.5 w-44">
                              <span className="text-xl">{habit.icon || '🎯'}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {habit.name}
                                </p>
                                <span 
                                  className="text-[9px] font-semibold uppercase tracking-wider block"
                                  style={{ color: habit.color }}
                                >
                                  {habit.category}
                                </span>
                              </div>
                            </td>

                            {/* Clickable Matrix cells */}
                            {days.map((d) => {
                              const isCompleted = logs.some(
                                (l) => l.habitId === habit.id && l.date === d.dateStr && l.completed
                              );
                              
                              const isToday = d.dateStr === formatDateString(new Date());
                              const isFuture = d.dateStr > formatDateString(new Date());

                              return (
                                <td key={d.dateStr} className="text-center px-1 py-3.5 w-9">
                                  <motion.button
                                    whileTap={!isFuture ? { scale: 0.9 } : {}}
                                    onClick={() => handleCellClick(habit.id, d.dateStr)}
                                    disabled={isFuture}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                      isCompleted
                                        ? 'border-transparent text-white shadow-sm'
                                        : isFuture 
                                          ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-35'
                                          : isToday
                                            ? 'border-accent/50 bg-accent/5 hover:bg-accent/15'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                                    }`}
                                    style={{
                                      backgroundColor: isCompleted ? habit.color : undefined,
                                      boxShadow: isCompleted ? `0 2px 8px ${habit.color}35` : undefined
                                    }}
                                    title={`${habit.name} - ${d.dateStr}`}
                                  >
                                    {isCompleted && (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    )}
                                  </motion.button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
