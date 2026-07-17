'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { 
  getChartData, 
  generateSmartInsights, 
  formatDateString, 
  calculateOverallStreaks,
  calculateConsistency
} from '../../lib/statsCalculations';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  Sparkles, 
  Percent,
  MessageSquare,
  Calendar,
  Grid
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    habits, 
    logs, 
    isLoading: storeLoading 
  } = useHabitStore();

  const [tooltipData, setTooltipData] = useState<{
    date: string;
    completed: number;
    total: number;
    percent: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || storeLoading || !user) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // 1. Get raw analytics calculations
  const { currentStreak, longestStreak } = calculateOverallStreaks(logs);
  const consistencyPercent = calculateConsistency(habits, logs);
  const activeHabitsCount = habits.filter((h) => h.active).length;

  // 2. Prepare charts datasets
  const { 
    dailyCompletionData, 
    weeklyData, 
    categoryData, 
    habitSuccessData 
  } = getChartData(habits, logs);

  const insights = generateSmartInsights(habits, logs);

  // 3. Generate GitHub Style Heatmap Grid (Last 20 Weeks for desktop, 10 Weeks for mobile)
  // Let's generate exactly the last 133 days (19 weeks) to display a nice grid
  const generateHeatmapDates = () => {
    const dates = [];
    const today = new Date();
    // Start from 19 weeks ago, back to the nearest Sunday
    const totalDays = 19 * 7;
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays + 1);

    // Adjust to start on Sunday
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDay);

    const endDate = new Date(today);
    // Fill up to Saturday of current week
    const endDay = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDay));

    let curr = new Date(startDate);
    while (curr <= endDate) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const heatmapDates = generateHeatmapDates();

  // Group heatmap dates into weeks (columns)
  const heatmapWeeks = [];
  for (let i = 0; i < heatmapDates.length; i += 7) {
    heatmapWeeks.push(heatmapDates.slice(i, i + 7));
  }

  // Color mapper based on completion percentage for Heatmap cells
  const getHeatmapColorClass = (percent: number) => {
    if (percent === 0) return 'bg-slate-100 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50';
    if (percent <= 25) return 'bg-accent/20 border-accent/25';
    if (percent <= 50) return 'bg-accent/40 border-accent/45';
    if (percent <= 75) return 'bg-accent/70 border-accent/75';
    return 'bg-accent border-transparent shadow-sm shadow-accent/20';
  };

  const getHeatmapCellInfo = (date: Date) => {
    const dateStr = formatDateString(date);
    const dayLogs = logs.filter(l => l.date === dateStr);
    const completed = dayLogs.filter(l => l.completed).length;
    // Active habits on that date (started before or on that date)
    const activeOnDate = habits.filter(h => h.active && h.startDate <= dateStr).length;
    const percent = activeOnDate > 0 ? Math.round((completed / activeOnDate) * 100) : 0;
    
    return { completed, total: activeOnDate, percent, dateStr };
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics Dashboard
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Interactive Statistics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize consistency trends, success ratios, and category performance.
          </p>
        </div>
      </div>

      {/* QUICK CORE STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Consistency Rate</span>
          <div className="flex items-center gap-2 mt-2">
            <Percent className="w-6 h-6 text-accent" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{consistencyPercent}%</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Current Streak</span>
          <div className="flex items-center gap-2 mt-2">
            <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{currentStreak} days</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Longest Streak</span>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{longestStreak} days</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Habits</span>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <span className="text-2xl font-black text-slate-900 dark:text-white">{activeHabitsCount} tracked</span>
          </div>
        </div>
      </div>

      {/* GITHUB STYLE CONTRIBUTION HEATMAP */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-accent" />
              Consistency Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Your daily activity across the last 19 weeks.</p>
          </div>
          {/* Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent/20 border border-accent/25" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent/40 border border-accent/45" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent/70 border border-accent/75" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="relative overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex gap-1 min-w-max p-1 justify-center sm:justify-start">
            {/* Weekday indicator labels */}
            <div className="flex flex-col justify-around text-[9px] font-bold text-slate-400 pr-2 pb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Weeks Columns */}
            {heatmapWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((date) => {
                  const { completed, total, percent, dateStr } = getHeatmapCellInfo(date);
                  
                  return (
                    <div
                      key={dateStr}
                      onMouseEnter={() => setTooltipData({ date: dateStr, completed, total, percent })}
                      onMouseLeave={() => setTooltipData(null)}
                      className={`w-3 h-3 rounded-sm border cursor-pointer transition-all hover:scale-110 ${getHeatmapColorClass(percent)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Tooltip overlay details */}
        <div className="h-6 flex items-center justify-center sm:justify-start text-xs font-semibold text-slate-500">
          {tooltipData ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {new Date(tooltipData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: <span className="font-extrabold text-accent">{tooltipData.completed} / {tooltipData.total}</span> habits completed ({tooltipData.percent}%)
            </motion.p>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hover over squares to inspect completion stats</span>
          )}
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATION SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completion Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Daily Completion Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Success percentage over the last 14 active days.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyCompletionData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} unit="%"/>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15,23,42,0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
                />
                <Area type="monotone" dataKey="rate" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Progress Bar Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Weekly Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total count and completion rate for the last 4 weeks.</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)"/>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(15,23,42,0.9)', 
                    border: 'none', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [value, name === 'rate' ? 'Rate (%)' : 'Completions']}
                />
                <Bar dataKey="completions" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Category Allocation</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of completions across categories.</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Log habits to populate category data.</p>
            ) : (
              <ResponsiveContainer width="100%" height="105%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || 'var(--accent-primary)'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(15,23,42,0.9)', 
                      border: 'none', 
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Success Rates of Habits (Sorted Bar List) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Habit Success Ratios</h3>
            <p className="text-xs text-slate-400 mt-0.5">Success rates compared across active habits.</p>
          </div>
          <div className="h-64 overflow-y-auto space-y-3.5 pr-2 scrollbar-thin">
            {habitSuccessData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Create habits and log logs to see ratios.</p>
            ) : (
              habitSuccessData.map((h) => (
                <div key={h.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-850 dark:text-slate-200">{h.name}</span>
                    <span style={{ color: h.color }}>{h.rate}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.rate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SMART INSIGHTS LIST */}
      <div className="p-5 rounded-3xl bg-gradient-to-tr from-accent/5 to-accent-hover/10 border border-accent/15 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Smart Insights Generator
          </h3>
        </div>
        <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex gap-2 items-start leading-relaxed">
              <span className="text-accent mt-0.5">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
