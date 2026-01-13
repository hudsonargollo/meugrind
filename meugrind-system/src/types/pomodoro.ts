import { SyncableEntity } from './index';

export interface PomodoroSession extends SyncableEntity {
  duration: number; // minutes
  breakDuration: number; // minutes
  projectId?: string;
  taskCategory: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  notes?: string;
  interruptions: Interruption[];
  focusScore?: number; // 1-10 rating
}

export interface Interruption {
  id: string;
  timestamp: Date;
  type: 'internal' | 'external';
  description?: string;
  duration: number; // seconds
}

export interface FocusMode {
  isActive: boolean;
  sessionId: string;
  suppressNotifications: boolean;
  blockedApps?: string[];
  startTime: Date;
  settings: FocusModeSettings;
}

export interface FocusModeSettings {
  allowUrgentNotifications: boolean;
  whitelistedContacts: string[];
  breakReminders: boolean;
  ambientSounds: boolean;
  soundType?: 'nature' | 'white_noise' | 'binaural' | 'silence';
}

export interface PomodoroStats {
  date: Date;
  completedSessions: number;
  totalFocusTime: number; // minutes
  averageSessionLength: number; // minutes
  interruptions: number;
  categories: CategoryStats[];
  productivity: ProductivityMetrics;
}

export interface CategoryStats {
  category: string;
  sessions: number;
  totalTime: number; // minutes
  averageFocusScore: number;
}

export interface ProductivityMetrics {
  focusScore: number; // 1-10 average
  consistency: number; // days with sessions / total days
  streak: number; // consecutive days with sessions
  weeklyGoal: number; // target sessions per week
  weeklyProgress: number; // actual sessions this week
}

export interface PomodoroSettings {
  workDuration: number; // minutes, default 25
  shortBreakDuration: number; // minutes, default 5
  longBreakDuration: number; // minutes, default 15
  sessionsUntilLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  soundEnabled: boolean;
  tickingSound: boolean;
  endSound: string;
  notifications: boolean;
}

export interface StudyTracker {
  id: string;
  category: string;
  subcategory?: string;
  timeSpent: number; // minutes
  date: Date;
  notes?: string;
  resources?: string[]; // URLs or file paths
  progress: number; // 0-100 percentage
}

export interface StudyStreak {
  category: string;
  currentStreak: number; // days
  longestStreak: number; // days
  lastStudyDate: Date;
  totalHours: number;
}