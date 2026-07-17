'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useHabitStore } from '../../store/useHabitStore';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Palette, 
  Bell, 
  Sparkles, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Printer, 
  Volume2, 
  VolumeX,
  FileCode,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

const ACCENTS = [
  { id: 'blue', name: 'Sky Blue', class: 'bg-blue-500' },
  { id: 'purple', name: 'Royal Purple', class: 'bg-purple-500' },
  { id: 'green', name: 'Emerald Green', class: 'bg-emerald-500' },
  { id: 'orange', name: 'Coral Orange', class: 'bg-orange-500' },
  { id: 'pink', name: 'Hot Pink', class: 'bg-pink-500' },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const { 
    habits, 
    logs, 
    settings, 
    setTheme, 
    setAccentColor, 
    toggleHighContrast, 
    toggleNotifications,
    importData, 
    clearData,
    isLoading: storeLoading 
  } = useHabitStore();

  const [notifState, setNotifState] = useState(settings.notificationsEnabled);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // 1. Request Browser Notifications Permission
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toggleNotifications(true);
        setNotifState(true);
        showNotification('Notifications enabled successfully!');
      } else {
        toggleNotifications(false);
        setNotifState(false);
      }
    } else if (Notification.permission === 'granted') {
      const newState = !notifState;
      toggleNotifications(newState);
      setNotifState(newState);
      showNotification(newState ? 'Notifications enabled!' : 'Notifications disabled.');
    } else {
      alert('Notifications are blocked by your browser settings. Please enable them manually.');
    }
  };

  // 2. CSV Export
  const handleCSVExport = () => {
    if (habits.length === 0) {
      alert("No habits available to export.");
      return;
    }

    const headers = ['id', 'name', 'icon', 'color', 'category', 'priority', 'frequency', 'startDate', 'active', 'description', 'targetDays', 'reminderTime'];
    const csvRows = [headers.join(',')];

    habits.forEach(h => {
      const values = [
        `"${h.id}"`,
        `"${h.name.replace(/"/g, '""')}"`,
        `"${h.icon}"`,
        `"${h.color}"`,
        `"${h.category}"`,
        `"${h.priority}"`,
        `"${h.frequency}"`,
        `"${h.startDate}"`,
        `"${h.active}"`,
        `"${(h.description || '').replace(/"/g, '""')}"`,
        `"${h.targetDays || 30}"`,
        `"${h.reminderTime || ''}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'momentum_habits_backup.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('CSV exported successfully!');
  };

  // 3. CSV Import
  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) return;

      const newHabits: any[] = [];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter taking quotes into account
        const values: string[] = [];
        let currentVal = '';
        let insideQuote = false;

        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentVal.trim().replace(/^"|"$/g, ''));
            currentVal = '';
          } else {
            currentVal += char;
          }
        }
        values.push(currentVal.trim().replace(/^"|"$/g, ''));

        if (values.length < 2) continue;

        const h: any = {};
        headers.forEach((header, idx) => {
          const val = values[idx];
          if (header === 'active') {
            h[header] = val === 'true';
          } else if (header === 'targetDays') {
            h[header] = Number(val) || 30;
          } else {
            h[header] = val;
          }
        });

        newHabits.push(h);
      }

      if (newHabits.length > 0) {
        await importData(newHabits, logs);
        showNotification(`Successfully imported ${newHabits.length} habits!`);
      } else {
        alert("Failed to parse any valid habits from CSV.");
      }
    };
    reader.readAsText(file);
  };

  // 4. JSON Backup (Full State Backup)
  const handleJSONBackup = () => {
    const backupData = {
      habits,
      logs,
      settings,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'momentum_full_backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Full JSON backup exported!');
  };

  // 5. JSON Restore
  const handleJSONRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data && Array.isArray(data.habits) && Array.isArray(data.logs)) {
          await importData(data.habits, data.logs);
          showNotification('System restored successfully!');
        } else {
          alert('Invalid backup file. Habits and logs are missing.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  // 6. Print Report Trigger
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* HEADER SECTION */}
      <div>
        <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1">
          <Settings className="w-3.5 h-3.5" /> Preferences Cockpit
        </span>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
          Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Tune your accent colors, toggle theme preferences, or configure backups.
        </p>
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {successMsg && (
        <div className="fixed bottom-24 right-6 md:bottom-8 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* 1. VISUAL THEME PREFERENCES */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Palette className="w-4.5 h-4.5 text-accent" />
          Appearance Settings
        </h3>

        {/* Theme mode buttons */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Theme Mode</span>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', name: 'Light', icon: Sun },
              { id: 'dark', name: 'Dark', icon: Moon },
              { id: 'system', name: 'System', icon: Monitor },
            ].map((t) => {
              const IconComp = t.icon;
              const isActive = settings.theme === t.id;
              
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`py-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition ${
                    isActive
                      ? 'border-accent bg-accent/5 dark:bg-accent/10 text-accent font-black shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Selector */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-850/50">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Accent Primary Color</span>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((accent) => {
              const isActive = settings.accentColor === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() => setAccentColor(accent.id)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
                    isActive
                      ? 'border-accent bg-accent/5 dark:bg-accent/10 text-accent'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${accent.class} shadow-inner`} />
                  {accent.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. ACCESSIBILITY & NOTIFICATIONS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4.5 h-4.5 text-accent animate-swing" />
          Alerts & Accessibility
        </h3>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-850/40">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Browser Reminders</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Toggle browser push alert notifications</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer ${
              notifState ? 'bg-accent flex justify-end' : 'bg-slate-200 dark:bg-slate-800 flex justify-start'
            }`}
          >
            <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
          </button>
        </div>

        {/* High contrast mode toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">High Contrast Mode</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Adjust fonts and border lines for increased readability</p>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`w-12 h-6.5 rounded-full p-1 transition-all cursor-pointer ${
              settings.highContrast ? 'bg-accent flex justify-end' : 'bg-slate-200 dark:bg-slate-800 flex justify-start'
            }`}
          >
            <span className="w-4.5 h-4.5 bg-white rounded-full shadow-md" />
          </button>
        </div>
      </div>

      {/* 3. PRINT & REPORT UTILITIES */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Printer className="w-4.5 h-4.5 text-accent" />
          Reporting
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Produce a printable version of your tracking dashboards and stats summary for diagnostic/offline records.
        </p>
        <button
          onClick={handlePrintReport}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-2"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Performance Report
        </button>
      </div>

      {/* 4. BACKUP, CSV EXPORT, RESTORE */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCode className="w-4.5 h-4.5 text-accent" />
          Database Backups & Import
        </h3>

        {/* CSV Block */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-slate-750 dark:text-slate-200">CSV Management</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Export your habits list as a CSV file, or upload a CSV backup.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCSVExport}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import CSV
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* JSON Backup block */}
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-850/50">
          <h4 className="text-xs font-extrabold text-slate-750 dark:text-slate-200">Full JSON Database Dump</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Full backup including all daily logs, check history, settings, and habits.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleJSONBackup}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export Full JSON
            </button>
            <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Restore Full JSON
              <input type="file" accept=".json" onChange={handleJSONRestore} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 5. DESTRUCTION BLOCK */}
      <div className="p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-rose-500 flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5" />
          Danger Zone
        </h3>
        <p className="text-xs text-rose-450 dark:text-rose-400/80 leading-relaxed">
          Wipe out all database logs and habits. This action is irreversible. All local cache and cloud data associated with your profile will be wiped out.
        </p>
        <button
          onClick={async () => {
            if (confirm('CRITICAL WARNING: Are you sure you want to permanently clear all habits, completion history, and settings? This cannot be undone.')) {
              await clearData();
              showNotification('Database cleared successfully.');
              router.push('/dashboard');
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Wipe Database Data
        </button>
      </div>
    </div>
  );
}
