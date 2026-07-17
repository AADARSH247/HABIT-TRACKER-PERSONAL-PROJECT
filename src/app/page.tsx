'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, ArrowRight, Flame, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-sm font-semibold text-slate-400">Loading Momentum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col justify-between overflow-hidden">
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* TOP NAVIGATION / LOGO */}
      <header className="px-6 py-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-accent to-accent-hover shadow-lg shadow-accent/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">Momentum</span>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-sm font-semibold hover:text-accent transition duration-200"
        >
          Sign In
        </button>
      </header>

      {/* HERO SECTION */}
      <main className="px-6 py-12 max-w-5xl mx-auto w-full flex flex-col items-center text-center z-10 flex-1 justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 backdrop-blur-md text-[11px] font-bold text-accent tracking-wide uppercase mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> Gamified Habit Tracker
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl"
        >
          Build Consistency. <br />
          <span className="bg-gradient-to-r from-accent via-accent-hover to-blue-500 bg-clip-text text-transparent">
            Unleash Your Momentum.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 text-sm sm:text-lg max-w-xl mt-6 leading-relaxed"
        >
          Visualize your habits, maintain streaks, earn badges, and watch your daily progress stack up with an elegant, offline-first dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent-hover hover:scale-[1.02] active:scale-95 shadow-lg shadow-accent/30 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
          >
            Start Tracking Free
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => router.push('/login?demo=true')}
            className="px-8 py-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            Try Local Guest Demo
          </button>
        </motion.div>

        {/* FEATURES GRID MOCK */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20"
        >
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Flame className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">3-Month Grid Matrix</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Track daily habits inside a beautiful contribution board representing exactly 90 days. Click squares to toggle completion instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Interactive Statistics</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Unlock productivity grades, daily graphs, category pie charts, and a GitHub-style heatmap showing exact yearly activity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base">Gamification Badges</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Earn rewards and unlock badges for milestones like perfect weeks, perfect months, consistency master, and night owl challenges.
            </p>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-500 z-10 bg-slate-950/20">
        © {new Date().getFullYear()} Momentum Habit Tracker. Premium UI/UX, built offline-first.
      </footer>
    </div>
  );
}
