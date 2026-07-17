'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { Habit, DailyLog } from '../../types';
import { formatDateString } from '../../lib/statsCalculations';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { habits, logs, isLoading: storeLoading } = useHabitStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(formatDateString(new Date()));

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

  // Go to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Go to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const activeHabits = habits.filter(h => h.active);

  // Generate calendar days for currentMonth
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0, Monday = 1
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = [];

  // Empty cells for padding before the 1st of the month
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }

  // Days of the month
  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, month, day);
    daysArray.push({
      dayNumber: day,
      dateStr: formatDateString(dateObj),
      dateObj
    });
  }

  // Filter completed habits for a date
  const getCompletionsForDate = (dateStr: string) => {
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    const completedHabitIds = dayLogs.map(l => l.habitId);
    return activeHabits.filter(h => completedHabitIds.includes(h.id));
  };

  const getMissedForDate = (dateStr: string) => {
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    const completedHabitIds = dayLogs.map(l => l.habitId);
    return activeHabits.filter(h => !completedHabitIds.includes(h.id));
  };

  const selectedCompletions = getCompletionsForDate(selectedDateStr);
  const selectedMissed = getMissedForDate(selectedDateStr);

  const formattedMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div>
        <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> History Calendar
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
          Monthly History View
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Select a date to audit your completed and pending habits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CALENDAR MONTH GRID CARD */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          {/* Calendar month controls */}
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {formattedMonthName}
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday indicators header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-850">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const isSelected = selectedDateStr === day.dateStr;
              const isToday = day.dateStr === formatDateString(new Date());
              const isFuture = day.dateStr > formatDateString(new Date());
              
              const dayCompletions = getCompletionsForDate(day.dateStr);

              return (
                <button
                  key={day.dateStr}
                  disabled={isFuture}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`min-h-[64px] p-1.5 rounded-2xl border flex flex-col justify-between items-center transition-all cursor-pointer ${
                    isFuture
                      ? 'border-transparent text-slate-300 dark:text-slate-800 cursor-not-allowed'
                      : isSelected
                        ? 'border-accent bg-accent/5 dark:bg-accent/10 shadow-sm'
                        : isToday
                          ? 'border-slate-300 dark:border-slate-750 bg-slate-50 dark:bg-slate-850'
                          : 'border-slate-100 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-750'
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    isFuture ? 'text-slate-300 dark:text-slate-800' : isSelected ? 'text-accent' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {day.dayNumber}
                  </span>

                  {/* Completion dot indicators */}
                  <div className="flex flex-wrap justify-center gap-1 w-full max-w-[40px] mt-1.5 min-h-[6px]">
                    {dayCompletions.slice(0, 4).map(h => (
                      <span
                        key={h.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: h.color }}
                      />
                    ))}
                    {dayCompletions.length > 4 && (
                      <span className="text-[7px] leading-none font-black text-slate-400">+</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTED DATE DETAILS PANEL */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Audit log for the selected date.</p>
          </div>

          {/* Completed Section */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed ({selectedCompletions.length})
            </h4>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {selectedCompletions.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No habits completed on this date.</p>
              ) : (
                selectedCompletions.map(h => (
                  <div key={h.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-sm">{h.icon}</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200">{h.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Missed Section */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-850">
            <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Missed / Unchecked ({selectedMissed.length})
            </h4>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {selectedMissed.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Perfect day! Zero missed habits.</p>
              ) : (
                selectedMissed.map(h => (
                  <div key={h.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-sm">{h.icon}</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200">{h.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
