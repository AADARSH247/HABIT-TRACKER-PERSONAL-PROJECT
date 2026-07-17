import { create } from 'zustand';
import { Habit, DailyLog, Achievement, UserSettings } from '../types';
import { isFirebaseAvailable, db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { calculateOverallStreaks, calculateHabitStreaks, formatDateString } from '../lib/statsCalculations';
import { calculateAchievements } from '../lib/achievementsList';

interface HabitState {
  habits: Habit[];
  logs: DailyLog[];
  achievements: Achievement[];
  settings: UserSettings;
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  userId: string | null;
  
  // Actions
  initStore: () => Promise<void>;
  setUserId: (uid: string | null) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'active'>) => Promise<void>;
  editHabit: (habitId: string, updated: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date: string) => Promise<boolean>; // Returns true if a new achievement was unlocked
  
  // Settings
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: 'blue' | 'purple' | 'green' | 'orange' | 'pink') => void;
  toggleHighContrast: () => void;
  toggleNotifications: (enabled: boolean) => void;
  
  // Import/Export/Backup
  importData: (habits: Habit[], logs: DailyLog[]) => Promise<void>;
  clearData: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: 'purple',
  notificationsEnabled: false,
  offlineMode: false,
  highContrast: false,
};

export const useHabitStore = create<HabitState>((set, get) => {
  // Sync state helper to write to local storage
  const syncToLocalStorage = (habits: Habit[], logs: DailyLog[], settings: UserSettings) => {
    localStorage.setItem('momentum_habits', JSON.stringify(habits));
    localStorage.setItem('momentum_logs', JSON.stringify(logs));
    localStorage.setItem('momentum_settings', JSON.stringify(settings));
  };

  // Helper to run achievements check and return if a new one was unlocked
  const updateAchievementsState = (habits: Habit[], logs: DailyLog[]): { achievements: Achievement[], unlockedNew: boolean } => {
    const overallStreaks = calculateOverallStreaks(logs);
    
    // Calculate individual habit streaks
    const habitStreaks: Record<string, { longest: number; current: number }> = {};
    habits.forEach(h => {
      habitStreaks[h.id] = calculateHabitStreaks(h.id, logs);
    });

    // Total possible logs is the number of active habits times the number of unique days tracked
    const uniqueDates = Array.from(new Set(logs.map(l => l.date)));
    const totalCompleted = logs.filter(l => l.completed).length;
    const totalPossible = (habits.filter(h => h.active).length * uniqueDates.length) || 1;
    const overallCompletionPercent = Math.round((totalCompleted / totalPossible) * 100);

    const calculated = calculateAchievements(habits, logs, overallStreaks, habitStreaks, overallCompletionPercent);
    
    // Check if any achievement just got unlocked that wasn't before in the previous state (or local storage)
    const prevAchievementsStr = localStorage.getItem('momentum_unlocked_achievements') || '[]';
    const previouslyUnlockedIds: string[] = JSON.parse(prevAchievementsStr);

    const currentlyUnlockedIds = calculated.filter(a => a.unlockedAt !== null).map(a => a.id);
    
    // Find newly unlocked achievements
    const newlyUnlocked = currentlyUnlockedIds.filter(id => !previouslyUnlockedIds.includes(id));
    
    if (newlyUnlocked.length > 0) {
      localStorage.setItem('momentum_unlocked_achievements', JSON.stringify(currentlyUnlockedIds));
      return { achievements: calculated, unlockedNew: true };
    }

    // Save current list
    localStorage.setItem('momentum_unlocked_achievements', JSON.stringify(currentlyUnlockedIds));
    return { achievements: calculated, unlockedNew: false };
  };

  return {
    habits: [],
    logs: [],
    achievements: [],
    settings: DEFAULT_SETTINGS,
    isLoading: true,
    isSyncing: false,
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    userId: null,

    initStore: async () => {
      set({ isLoading: true });
      const { userId } = get();

      // Check online status listener
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => set({ isOnline: true }));
        window.addEventListener('offline', () => set({ isOnline: false }));
      }

      // 1. Load settings
      let localSettings = DEFAULT_SETTINGS;
      try {
        const savedSettings = localStorage.getItem('momentum_settings');
        if (savedSettings) {
          localSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
      } catch (e) {
        console.error("Failed to parse settings from localStorage:", e);
      }

      // 2. Local fallback data loading
      let localHabits: Habit[] = [];
      let localLogs: DailyLog[] = [];

      try {
        const savedHabits = localStorage.getItem('momentum_habits');
        const savedLogs = localStorage.getItem('momentum_logs');
        if (savedHabits) localHabits = JSON.parse(savedHabits);
        if (savedLogs) localLogs = JSON.parse(savedLogs);
      } catch (e) {
        console.error("Failed to parse habits/logs from localStorage:", e);
      }

      // If Firebase is available and user is logged in, pull from Firestore
      if (isFirebaseAvailable && userId) {
        set({ isSyncing: true });
        try {
          // Fetch habits
          const habitsQuery = query(collection(db, `users/${userId}/habits`));
          const habitsSnapshot = await getDocs(habitsQuery);
          const dbHabits: Habit[] = [];
          habitsSnapshot.forEach((docSnap) => {
            dbHabits.push({ id: docSnap.id, ...docSnap.data() } as Habit);
          });

          // Fetch logs
          const logsQuery = query(collection(db, `users/${userId}/logs`));
          const logsSnapshot = await getDocs(logsQuery);
          const dbLogs: DailyLog[] = [];
          logsSnapshot.forEach((docSnap) => {
            dbLogs.push(docSnap.data() as DailyLog);
          });

          // Fetch settings
          // (We will write settings to users/{userId}/settings/userSettings)
          // For now, if firestore has records, we use them, or fallback to local
          const settingsSnap = await getDocs(query(collection(db, `users/${userId}/settings`)));
          let dbSettings = localSettings;
          settingsSnap.forEach((docSnap) => {
            if (docSnap.id === 'userSettings') {
              dbSettings = { ...localSettings, ...docSnap.data() } as UserSettings;
            }
          });

          // If local data is newer or has items, merge them or ask (for simplicity, we merge or override if DB is empty)
          if (dbHabits.length === 0 && localHabits.length > 0) {
            // Push local to firestore
            const batch = writeBatch(db);
            localHabits.forEach(h => {
              const hRef = doc(db, `users/${userId}/habits`, h.id);
              batch.set(hRef, h);
            });
            localLogs.forEach(l => {
              const lRef = doc(db, `users/${userId}/logs`, `${l.habitId}_${l.date}`);
              batch.set(lRef, l);
            });
            const sRef = doc(db, `users/${userId}/settings`, 'userSettings');
            batch.set(sRef, localSettings);
            await batch.commit();

            set({
              habits: localHabits,
              logs: localLogs,
              settings: localSettings,
            });
          } else {
            // Update local storage with db data
            syncToLocalStorage(dbHabits, dbLogs, dbSettings);
            set({
              habits: dbHabits,
              logs: dbLogs,
              settings: dbSettings,
            });
          }
        } catch (error) {
          console.error("Firestore sync failed, running with local cache:", error);
          set({
            habits: localHabits,
            logs: localLogs,
            settings: localSettings,
          });
        } finally {
          set({ isSyncing: false });
        }
      } else {
        // Run completely local
        set({
          habits: localHabits,
          logs: localLogs,
          settings: localSettings,
        });
      }

      // Compute achievements
      const { habits, logs } = get();
      const { achievements } = updateAchievementsState(habits, logs);
      set({ achievements, isLoading: false });
    },

    setUserId: async (uid: string | null) => {
      set({ userId: uid });
      await get().initStore();
    },

    addHabit: async (newHabit) => {
      const habit: Habit = {
        ...newHabit,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        active: true
      };

      const updatedHabits = [...get().habits, habit];
      const { logs, settings, userId } = get();

      set({ habits: updatedHabits });
      syncToLocalStorage(updatedHabits, logs, settings);

      if (isFirebaseAvailable && userId) {
        try {
          await setDoc(doc(db, `users/${userId}/habits`, habit.id), habit);
        } catch (e) {
          console.error("Failed to sync new habit to Firestore:", e);
        }
      }

      // Recalculate achievements
      const { achievements } = updateAchievementsState(updatedHabits, logs);
      set({ achievements });
    },

    editHabit: async (habitId, updatedFields) => {
      const updatedHabits = get().habits.map(h => 
        h.id === habitId ? { ...h, ...updatedFields } : h
      );
      const { logs, settings, userId } = get();

      set({ habits: updatedHabits });
      syncToLocalStorage(updatedHabits, logs, settings);

      if (isFirebaseAvailable && userId) {
        try {
          await setDoc(doc(db, `users/${userId}/habits`, habitId), updatedFields, { merge: true });
        } catch (e) {
          console.error("Failed to sync edited habit to Firestore:", e);
        }
      }
    },

    deleteHabit: async (habitId) => {
      const updatedHabits = get().habits.filter(h => h.id !== habitId);
      // Remove logs associated with this habit
      const updatedLogs = get().logs.filter(l => l.habitId !== habitId);
      const { settings, userId } = get();

      set({ habits: updatedHabits, logs: updatedLogs });
      syncToLocalStorage(updatedHabits, updatedLogs, settings);

      if (isFirebaseAvailable && userId) {
        try {
          await deleteDoc(doc(db, `users/${userId}/habits`, habitId));
          // Note: In production we'd also batch-delete the logs from Firestore.
          // For simplicity we will clean up in Local storage and Firestore logs will get deleted
          // dynamically or stay orphaned (which is fine). We can delete logs if we want, but Firebase deletes
          // require individual document deletes, which can be done in chunks.
          const logsQuery = query(collection(db, `users/${userId}/logs`), where('habitId', '==', habitId));
          const logsSnapshot = await getDocs(logsQuery);
          const batch = writeBatch(db);
          logsSnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to delete habit from Firestore:", e);
        }
      }

      const { achievements } = updateAchievementsState(updatedHabits, updatedLogs);
      set({ achievements });
    },

    archiveHabit: async (habitId) => {
      await get().editHabit(habitId, { active: false });
    },

    toggleHabitCompletion: async (habitId, date) => {
      const { habits, logs, settings, userId } = get();
      
      const existingLogIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);
      let updatedLogs = [...logs];
      
      if (existingLogIndex >= 0) {
        const existingLog = logs[existingLogIndex];
        if (existingLog.completed) {
          // Uncheck
          updatedLogs[existingLogIndex] = {
            ...existingLog,
            completed: false,
            completedAt: undefined
          };
        } else {
          // Check again
          updatedLogs[existingLogIndex] = {
            ...existingLog,
            completed: true,
            completedAt: new Date().toISOString()
          };
        }
      } else {
        // Create new log
        updatedLogs.push({
          habitId,
          date,
          completed: true,
          completedAt: new Date().toISOString()
        });
      }

      set({ logs: updatedLogs });
      syncToLocalStorage(habits, updatedLogs, settings);

      // Firestore update
      if (isFirebaseAvailable && userId) {
        try {
          const logData = updatedLogs.find(l => l.habitId === habitId && l.date === date)!;
          await setDoc(doc(db, `users/${userId}/logs`, `${habitId}_${date}`), logData);
        } catch (e) {
          console.error("Failed to sync log to Firestore:", e);
        }
      }

      // Check achievements
      const { achievements, unlockedNew } = updateAchievementsState(habits, updatedLogs);
      set({ achievements });
      return unlockedNew;
    },

    setTheme: (theme) => {
      const updatedSettings = { ...get().settings, theme };
      set({ settings: updatedSettings });
      syncToLocalStorage(get().habits, get().logs, updatedSettings);
      
      // Update DB if logged in
      const { userId } = get();
      if (isFirebaseAvailable && userId) {
        setDoc(doc(db, `users/${userId}/settings`, 'userSettings'), { theme }, { merge: true })
          .catch(e => console.error("Theme sync failed:", e));
      }
    },

    setAccentColor: (accentColor) => {
      const updatedSettings = { ...get().settings, accentColor };
      set({ settings: updatedSettings });
      syncToLocalStorage(get().habits, get().logs, updatedSettings);

      const { userId } = get();
      if (isFirebaseAvailable && userId) {
        setDoc(doc(db, `users/${userId}/settings`, 'userSettings'), { accentColor }, { merge: true })
          .catch(e => console.error("Accent color sync failed:", e));
      }
    },

    toggleHighContrast: () => {
      const highContrast = !get().settings.highContrast;
      const updatedSettings = { ...get().settings, highContrast };
      set({ settings: updatedSettings });
      syncToLocalStorage(get().habits, get().logs, updatedSettings);

      const { userId } = get();
      if (isFirebaseAvailable && userId) {
        setDoc(doc(db, `users/${userId}/settings`, 'userSettings'), { highContrast }, { merge: true })
          .catch(e => console.error("High contrast sync failed:", e));
      }
    },

    toggleNotifications: (enabled) => {
      const updatedSettings = { ...get().settings, notificationsEnabled: enabled };
      set({ settings: updatedSettings });
      syncToLocalStorage(get().habits, get().logs, updatedSettings);

      const { userId } = get();
      if (isFirebaseAvailable && userId) {
        setDoc(doc(db, `users/${userId}/settings`, 'userSettings'), { notificationsEnabled: enabled }, { merge: true })
          .catch(e => console.error("Notifications setting sync failed:", e));
      }
    },

    importData: async (importedHabits, importedLogs) => {
      const { settings, userId } = get();
      
      // Ensure all imported habits have IDs and correct structure
      const cleanedHabits = importedHabits.map(h => ({
        ...h,
        id: h.id || crypto.randomUUID(),
        active: h.active !== undefined ? h.active : true,
        createdAt: h.createdAt || new Date().toISOString(),
        startDate: h.startDate || formatDateString(new Date())
      }));

      const cleanedLogs = importedLogs.map(l => ({
        ...l,
        completed: l.completed !== undefined ? l.completed : true,
        completedAt: l.completedAt || new Date().toISOString()
      }));

      set({ habits: cleanedHabits, logs: cleanedLogs });
      syncToLocalStorage(cleanedHabits, cleanedLogs, settings);

      if (isFirebaseAvailable && userId) {
        try {
          const batch = writeBatch(db);
          // Upload habits
          cleanedHabits.forEach(h => {
            batch.set(doc(db, `users/${userId}/habits`, h.id), h);
          });
          // Upload logs
          cleanedLogs.forEach(l => {
            batch.set(doc(db, `users/${userId}/logs`, `${l.habitId}_${l.date}`), l);
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to import data to Firestore:", e);
        }
      }

      const { achievements } = updateAchievementsState(cleanedHabits, cleanedLogs);
      set({ achievements });
    },

    clearData: async () => {
      const { settings, userId } = get();
      
      set({ habits: [], logs: [], achievements: [] });
      
      localStorage.removeItem('momentum_habits');
      localStorage.removeItem('momentum_logs');
      localStorage.removeItem('momentum_unlocked_achievements');
      
      if (isFirebaseAvailable && userId) {
        try {
          // Query all user habits and logs and delete them
          const habitsSnap = await getDocs(collection(db, `users/${userId}/habits`));
          const logsSnap = await getDocs(collection(db, `users/${userId}/logs`));
          
          const batch = writeBatch(db);
          habitsSnap.forEach(d => batch.delete(d.ref));
          logsSnap.forEach(d => batch.delete(d.ref));
          
          await batch.commit();
        } catch (e) {
          console.error("Failed to clear cloud data:", e);
        }
      }
    }
  };
});
