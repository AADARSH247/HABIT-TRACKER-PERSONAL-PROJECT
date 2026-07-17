'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import ThemeWatcher from '../components/ThemeWatcher';
import KeyboardShortcuts from '../components/KeyboardShortcuts';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Register Service Worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully!', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeWatcher />
      <KeyboardShortcuts />
      {children}
    </AuthProvider>
  );
}
