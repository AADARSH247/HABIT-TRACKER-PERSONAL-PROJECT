'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useHabitStore } from '../store/useHabitStore';
import { 
  LayoutDashboard, 
  Grid3X3, 
  CheckSquare, 
  BarChart3, 
  Calendar, 
  Award, 
  Settings, 
  LogOut,
  Sparkles,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline } = useHabitStore();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Matrix Grid', href: '/tracker', icon: Grid3X3 },
    { name: 'Manage Habits', href: '/habits', icon: CheckSquare },
    { name: 'Analytics', href: '/stats', icon: BarChart3 },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Badges', href: '/achievements', icon: Award },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Don't render sidebar on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl z-30 transition-all duration-300">
        {/* LOGO */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accent-hover shadow-lg shadow-accent/30 text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
              Momentum
            </h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Habit Tracker
            </p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer group ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute inset-0 bg-gradient-to-r from-accent to-accent-hover rounded-xl -z-10 shadow-md shadow-accent/20"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'Local User'}
              </p>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {user && (
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all duration-200 cursor-pointer group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              Log Out
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center h-full py-1 text-[10px] font-bold cursor-pointer relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'text-accent scale-110' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span className={`mt-0.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.name === 'Manage Habits' ? 'Habits' : item.name === 'Matrix Grid' ? 'Matrix' : item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute top-0 w-8 h-1 bg-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
