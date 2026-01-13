import { 
  PomodoroSession, 
  PomodoroSettings, 
  PomodoroStats, 
  FocusMode,
  StudyTracker,
  StudyStreak,
  CategoryStats,
  ProductivityMetrics
} from '../types/pomodoro';
import { pomodoroSessionCRUD, pomodoroStatsCRUD, studyTrackerCRUD } from './crud-operations';
import { serviceWorkerManager } from './service-worker-manager';
import { v4 as uuidv4 } from 'uuid';

export class PomodoroService {
  private static instance: PomodoroService;
  private currentSession: PomodoroSession | null = null;
  private timer: NodeJS.Timeout | null = null;
  private focusMode: FocusMode | null = null;
  private settings: PomodoroSettings;

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  static getInstance(): PomodoroService {
    if (!PomodoroService.instance) {
      PomodoroService.instance = new PomodoroService();
    }
    return PomodoroService.instance;
  }

  private getDefaultSettings(): PomodoroSettings {
    return {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartSessions: false,
      soundEnabled: true,
      tickingSound: false,
      endSound: 'bell',
      notifications: true
    };
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
      this.settings = { ...this.getDefaultSettings(), ...JSON.parse(saved) };
    }
  }

  private saveSettings(): void {
    localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
  }

  getSettings(): PomodoroSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<PomodoroSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  async startSession(taskCategory: string, projectId?: string): Promise<PomodoroSession> {
    if (this.currentSession) {
      throw new Error('A session is already active');
    }

    const session: PomodoroSession = {
      id: uuidv4(),
      duration: this.settings.workDuration,
      breakDuration: this.settings.shortBreakDuration,
      projectId,
      taskCategory,
      startTime: new Date(),
      completed: false,
      interruptions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'pending',
      version: 1
    };

    this.currentSession = session;
    await pomodoroSessionCRUD.create(session);

    // Start focus mode if enabled
    if (this.settings.notifications) {
      this.activateFocusMode(session.id);
    }

    // Schedule session end notification
    this.scheduleSessionEndNotification();

    return session;
  }

  async pauseSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to pause');
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Add interruption record
    const interruption = {
      id: uuidv4(),
      timestamp: new Date(),
      type: 'internal' as const,
      description: 'Session paused',
      duration: 0
    };

    this.currentSession.interruptions.push(interruption);
    this.currentSession.updatedAt = new Date();
    await pomodoroSessionCRUD.update(this.currentSession.id, this.currentSession);
  }

  async resumeSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No session to resume');
    }

    // Update the last interruption with duration
    const lastInterruption = this.currentSession.interruptions[this.currentSession.interruptions.length - 1];
    if (lastInterruption && lastInterruption.duration === 0) {
      lastInterruption.duration = Math.floor((new Date().getTime() - lastInterruption.timestamp.getTime()) / 1000);
    }

    this.currentSession.updatedAt = new Date();
    await pomodoroSessionCRUD.update(this.currentSession.id, this.currentSession);
  }

  async completeSession(notes?: string, focusScore?: number): Promise<PomodoroSession> {
    if (!this.currentSession) {
      throw new Error('No active session to complete');
    }

    this.currentSession.endTime = new Date();
    this.currentSession.completed = true;
    this.currentSession.notes = notes;
    this.currentSession.focusScore = focusScore;
    this.currentSession.updatedAt = new Date();

    await pomodoroSessionCRUD.update(this.currentSession.id, this.currentSession);

    // Update statistics
    await this.updateStats(this.currentSession);

    // Deactivate focus mode
    this.deactivateFocusMode();

    const completedSession = this.currentSession;
    this.currentSession = null;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    return completedSession;
  }

  async cancelSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session to cancel');
    }

    await pomodoroSessionCRUD.delete(this.currentSession.id);
    this.deactivateFocusMode();
    this.currentSession = null;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getCurrentSession(): PomodoroSession | null {
    return this.currentSession;
  }

  getTimeRemaining(): number {
    if (!this.currentSession) {
      return 0;
    }

    const elapsed = new Date().getTime() - this.currentSession.startTime.getTime();
    const sessionDuration = this.currentSession.duration * 60 * 1000; // Convert to milliseconds
    return Math.max(0, sessionDuration - elapsed);
  }

  private activateFocusMode(sessionId: string): void {
    this.focusMode = {
      isActive: true,
      sessionId,
      suppressNotifications: true,
      startTime: new Date(),
      settings: {
        allowUrgentNotifications: true,
        whitelistedContacts: [],
        breakReminders: true,
        ambientSounds: false
      }
    };

    // Update service worker with focus mode status
    serviceWorkerManager.updateFocusMode({
      isActive: true,
      sessionId,
      suppressNotifications: true,
      allowUrgentNotifications: true,
      whitelistedContacts: []
    }).catch(error => {
      console.error('Failed to update service worker focus mode:', error);
    });

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private deactivateFocusMode(): void {
    const wasActive = this.focusMode?.isActive;
    this.focusMode = null;

    // Update service worker to deactivate focus mode
    if (wasActive) {
      serviceWorkerManager.updateFocusMode({
        isActive: false,
        sessionId: '',
        suppressNotifications: false
      }).catch(error => {
        console.error('Failed to deactivate service worker focus mode:', error);
      });
    }
  }

  getFocusMode(): FocusMode | null {
    return this.focusMode;
  }

  /**
   * Schedule a Pomodoro notification through the service worker
   */
  private async scheduleNotification(title: string, body: string, scheduledTime?: number): Promise<void> {
    try {
      await serviceWorkerManager.scheduleNotification({
        title,
        body,
        icon: '/icon-192x192.png',
        tag: 'pomodoro-notification',
        category: 'pomodoro',
        priority: 'normal',
        scheduledTime: scheduledTime || Date.now()
      });
    } catch (error) {
      console.error('Failed to schedule Pomodoro notification:', error);
      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192x192.png' });
      }
    }
  }

  /**
   * Schedule session completion notification
   */
  private scheduleSessionEndNotification(): void {
    if (!this.currentSession || !this.settings.notifications) return;

    const endTime = this.currentSession.startTime.getTime() + (this.currentSession.duration * 60 * 1000);
    const title = 'Pomodoro Session Complete!';
    const body = 'Great job! Time for a well-deserved break.';

    this.scheduleNotification(title, body, endTime);
  }

  private async updateStats(session: PomodoroSession): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allStats = await pomodoroStatsCRUD.getAll() as unknown as PomodoroStats[];
    let stats = allStats.find(s => {
      const statsDate = new Date(s.date);
      statsDate.setHours(0, 0, 0, 0);
      return statsDate.getTime() === today.getTime();
    });
    
    if (!stats) {
      stats = {
        id: uuidv4(),
        date: today,
        completedSessions: 0,
        totalFocusTime: 0,
        averageSessionLength: 0,
        interruptions: 0,
        categories: [],
        productivity: {
          focusScore: 0,
          consistency: 0,
          streak: 0,
          weeklyGoal: 20,
          weeklyProgress: 0
        }
      } as PomodoroStats & { id: string };
    }

    // Update basic stats
    stats.completedSessions += 1;
    stats.totalFocusTime += session.duration;
    stats.interruptions += session.interruptions.length;
    stats.averageSessionLength = stats.totalFocusTime / stats.completedSessions;

    // Update category stats
    const categoryIndex = stats.categories.findIndex(c => c.category === session.taskCategory);
    if (categoryIndex >= 0) {
      const category = stats.categories[categoryIndex];
      category.sessions += 1;
      category.totalTime += session.duration;
      if (session.focusScore) {
        category.averageFocusScore = (category.averageFocusScore * (category.sessions - 1) + session.focusScore) / category.sessions;
      }
    } else {
      stats.categories.push({
        category: session.taskCategory,
        sessions: 1,
        totalTime: session.duration,
        averageFocusScore: session.focusScore || 0
      });
    }

    // Update productivity metrics
    if (session.focusScore) {
      const totalSessions = stats.completedSessions;
      const currentAvg = stats.productivity.focusScore;
      stats.productivity.focusScore = (currentAvg * (totalSessions - 1) + session.focusScore) / totalSessions;
    }

    // Save or update stats
    const statsWithId = stats as PomodoroStats & { id: string };
    const existingStats = await pomodoroStatsCRUD.getById(statsWithId.id);
    if (existingStats) {
      await pomodoroStatsCRUD.update(statsWithId.id, statsWithId as any);
    } else {
      await pomodoroStatsCRUD.create(statsWithId as any);
    }
  }

  async getSessionHistory(limit: number = 50): Promise<PomodoroSession[]> {
    return await pomodoroSessionCRUD.getAll() as unknown as PomodoroSession[];
  }

  async getStats(date?: Date): Promise<PomodoroStats | null> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const allStats = await pomodoroStatsCRUD.getAll() as unknown as PomodoroStats[];
    return allStats.find(s => {
      const statsDate = new Date(s.date);
      statsDate.setHours(0, 0, 0, 0);
      return statsDate.getTime() === targetDate.getTime();
    }) || null;
  }

  async getWeeklyStats(): Promise<PomodoroStats[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const stats: PomodoroStats[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStats = await this.getStats(new Date(d));
      if (dayStats) {
        stats.push(dayStats);
      }
    }
    return stats;
  }

  // Study tracker methods
  async logStudyTime(category: string, timeSpent: number, subcategory?: string, notes?: string): Promise<StudyTracker> {
    const studyEntry: StudyTracker = {
      id: uuidv4(),
      category,
      subcategory,
      timeSpent,
      date: new Date(),
      notes,
      progress: 0
    };

    await studyTrackerCRUD.create(studyEntry);
    return studyEntry;
  }

  async getStudyStreaks(): Promise<StudyStreak[]> {
    const allEntries = await studyTrackerCRUD.getAll() as unknown as StudyTracker[];
    const streakMap = new Map<string, StudyStreak>();

    // Group by category and calculate streaks
    allEntries.forEach(entry => {
      const category = entry.category;
      if (!streakMap.has(category)) {
        streakMap.set(category, {
          category,
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: entry.date,
          totalHours: 0
        });
      }

      const streak = streakMap.get(category)!;
      streak.totalHours += entry.timeSpent / 60; // Convert minutes to hours
      
      if (entry.date > streak.lastStudyDate) {
        streak.lastStudyDate = entry.date;
      }
    });

    return Array.from(streakMap.values());
  }
}

export const pomodoroService = PomodoroService.getInstance();