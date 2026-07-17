'use client';

import { useEffect } from 'react';
import { useHabitStore } from '../store/useHabitStore';

export default function ThemeWatcher() {
  const { theme, accentColor, highContrast } = useHabitStore((state) => state.settings);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Handle Dark/Light Mode
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme === 'dark');
    }

    // 2. Handle Accent Color Themes
    // Remove previous theme- classes
    const classes = Array.from(body.classList);
    classes.forEach((c) => {
      if (c.startsWith('theme-')) {
        body.classList.remove(c);
      }
    });

    body.classList.add(`theme-${accentColor}`);

    // 3. Handle High Contrast Mode
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [theme, accentColor, highContrast]);

  return null;
}
