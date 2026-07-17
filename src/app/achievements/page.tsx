'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { 
  Trophy, 
  Sparkles, 
  Flame, 
  Zap, 
  Award, 
  CalendarDays, 
  Sun, 
  Moon, 
  Crown, 
  Lock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

// Map icon string name to Lucide components
const IconMap: Record<string, React.ComponentType<any>> = {
  Sparkles,
  Flame,
  Zap,
  Award,
  CalendarDays,
  Trophy,
  Sun,
  Moon,
  Crown
};

export default function AchievementsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    achievements, 
    isLoading: storeLoading, 
    initStore 
  } = useHabitStore();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (authLoading || storeLoading || !user) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Count metrics
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length;
  const completionPercent = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-accent animate-bounce" /> Gamified Rewards
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Unlocked Badges
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Earn badges and achievements by maintaining streaks and consistency.
          </p>
        </div>

        {/* Global Progress */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Achievements</p>
            <p className="text-lg font-black text-slate-900 dark:text-slate-100">
              {unlockedCount} / {totalAchievements} <span className="text-xs text-slate-400">({completionPercent}%)</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-accent/25 border-t-accent flex items-center justify-center font-black text-xs text-accent">
            {completionPercent}%
          </div>
        </div>
      </div>

      {/* BADGES MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((ach) => {
          const isUnlocked = ach.unlockedAt !== null;
          const BadgeIcon = IconMap[ach.icon] || Award;
          
          return (
            <motion.div
              layout
              key={ach.id}
              whileHover={{ y: -3 }}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-accent/20 shadow-md shadow-accent/5'
                  : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              {/* Badge Icon and Locked status */}
              <div className="flex justify-between items-start">
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md relative ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-accent to-accent-hover shadow-accent/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none'
                  }`}
                >
                  <BadgeIcon className={`w-7 h-7 ${isUnlocked ? 'animate-pulse' : ''}`} />
                  {isUnlocked && (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 border border-white dark:border-slate-900">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                {!isUnlocked && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-lg">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-5">
                <h3 className="font-extrabold text-slate-900 dark:text-white leading-snug">
                  {ach.title}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress bars */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  <span>PROGRESS</span>
                  <span>
                    {ach.currentValue} / {ach.target}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-500"
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>

              {/* Unlock timestamp */}
              {isUnlocked && (
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850/50 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex justify-between">
                  <span>UNLOCKED ON</span>
                  <span>
                    {new Date(ach.unlockedAt!).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
