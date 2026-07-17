'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcuts() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [lastTime, setLastTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input, textarea or contenteditable element
      const activeElement = document.activeElement;
      const isInput = 
        activeElement?.tagName === 'INPUT' || 
        activeElement?.tagName === 'TEXTAREA' || 
        activeElement?.hasAttribute('contenteditable');
      
      if (isInput) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Toggle cheat sheet: '?' (shift + '/')
      if (e.key === '?') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape to close cheat sheet
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      // Check for 'g' prefix navigation shortcuts
      if (lastKey === 'g' && now - lastTime < 1000) {
        let route = '';
        switch (key) {
          case 'd':
            route = '/dashboard';
            break;
          case 'm':
            route = '/tracker';
            break;
          case 'h':
            route = '/habits';
            break;
          case 'a':
            route = '/stats';
            break;
          case 'c':
            route = '/calendar';
            break;
          case 'b':
            route = '/achievements';
            break;
          case 's':
            route = '/settings';
            break;
        }

        if (route) {
          e.preventDefault();
          router.push(route);
          setLastKey(null); // Reset
          return;
        }
      }

      // Add new habit shortcut: 'n'
      if (key === 'n') {
        e.preventDefault();
        router.push('/habits?action=new');
        return;
      }

      // Store current key for prefix combinations
      if (key === 'g') {
        setLastKey('g');
        setLastTime(now);
      } else {
        setLastKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastKey, lastTime, isOpen, router]);

  return (
    <>
      {/* Short Floating Button to Open Cheat Sheet */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 md:bottom-6 z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-lg text-slate-500 hover:text-slate-900 dark:hover:text-white backdrop-blur-md cursor-pointer hover:scale-105 transition-all duration-200"
        title="Keyboard Shortcuts (?)"
        aria-label="Keyboard Shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Keyboard Shortcuts
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SHORTCUTS LIST */}
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] mb-2">
                    Navigation (Press 'g' then letter)
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="flex items-center justify-between pr-4 border-r border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Dashboard</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + d</kbd>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-slate-600 dark:text-slate-300">Matrix Grid</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + m</kbd>
                    </div>
                    <div className="flex items-center justify-between pr-4 border-r border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Manage Habits</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + h</kbd>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-slate-600 dark:text-slate-300">Analytics</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + a</kbd>
                    </div>
                    <div className="flex items-center justify-between pr-4 border-r border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Calendar</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + c</kbd>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-slate-600 dark:text-slate-300">Badges</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + b</kbd>
                    </div>
                    <div className="flex items-center justify-between pr-4 border-r border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Settings</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">g + s</kbd>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] mb-2">
                    Actions
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">New Habit</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">n</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Toggle Shortcuts Menu</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">?</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Close Modals</span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 text-xs font-semibold">Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
