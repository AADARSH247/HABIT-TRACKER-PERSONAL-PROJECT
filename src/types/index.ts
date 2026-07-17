export interface Habit {
  id: string;
  name: string;
  icon: string; // Emoji or Lucide Icon name
  color: string; // Tailwind hex color code or class name
  category: string; // e.g. Health, Work, Mind, Fitness, etc.
  priority: 'low' | 'medium' | 'high';
  frequency: 'daily' | 'weekly' | 'custom';
  createdAt: string; // ISO string
  startDate: string; // YYYY-MM-DD
  active: boolean; // false if archived
  description?: string;
  targetDays?: number; // e.g., 30 days challenge, 66 days
  reminderTime?: string; // HH:MM format
}

export interface DailyLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO string
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null; // ISO string if unlocked, else null
  progress: number; // 0 to 100
  target: number; // target count/metric
  currentValue: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  notificationsEnabled: boolean;
  offlineMode: boolean;
  highContrast: boolean;
}

export interface UserData {
  habits: Habit[];
  logs: DailyLog[];
  settings: UserSettings;
}
