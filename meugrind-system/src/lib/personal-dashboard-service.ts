import { db } from './database';
import { Task, Event } from '../types';
import { StudyTracker, StudyStreak } from '../types/pomodoro';

export interface ImmediateAction {
  id: string;
  title: string;
  type: 'task' | 'event' | 'followup';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  category: string;
  moduleType?: 'band' | 'influencer' | 'solar' | 'pr' | 'personal';
  estimatedMinutes?: number;
}

export interface StudyCategory {
  name: string;
  subcategories: string[];
  color: string;
  icon: string;
}

export interface StudyProgress {
  category: string;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  weeklyGoal: number;
  weeklyProgress: number;
}

export class PersonalDashboardService {
  private static instance: PersonalDashboardService;

  public static getInstance(): PersonalDashboardService {
    if (!PersonalDashboardService.instance) {
      PersonalDashboardService.instance = new PersonalDashboardService();
    }
    return PersonalDashboardService.instance;
  }

  // Get next 3 immediate actions for Personal account
  async getImmediateActions(): Promise<ImmediateAction[]> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Get urgent tasks
    const allTasks = await db.tasks.toArray();
    const urgentTasks = allTasks
      .filter(task => !task.completed && (task.priority === 'urgent' || (task.dueDate && task.dueDate <= tomorrow)))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    // Get upcoming events (next 24 hours)
    const upcomingEvents = await db.events
      .where('startTime')
      .between(now, tomorrow)
      .and(event => event.visibility !== 'manager_only')
      .sortBy('startTime');

    // Get high priority tasks if we need more actions
    const highPriorityTasks = allTasks
      .filter(task => !task.completed && task.priority === 'high')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    // Convert to ImmediateAction format
    const actions: ImmediateAction[] = [];

    // Add urgent tasks first
    urgentTasks.forEach(task => {
      actions.push({
        id: task.id,
        title: task.title,
        type: 'task',
        priority: task.priority,
        dueDate: task.dueDate,
        category: task.category,
        estimatedMinutes: task.estimatedMinutes,
      });
    });

    // Add upcoming events
    upcomingEvents.forEach(event => {
      actions.push({
        id: event.id,
        title: event.title,
        type: 'event',
        priority: event.visibility === 'mandatory' ? 'high' : 'medium',
        dueDate: event.startTime,
        category: event.type,
        moduleType: event.moduleType,
      });
    });

    // Add high priority tasks if we need more
    if (actions.length < 3) {
      const needed = 3 - actions.length;
      const additionalTasks = highPriorityTasks
        .filter(task => !actions.some(action => action.id === task.id))
        .slice(0, needed);

      additionalTasks.forEach(task => {
        actions.push({
          id: task.id,
          title: task.title,
          type: 'task',
          priority: task.priority,
          dueDate: task.dueDate,
          category: task.category,
          estimatedMinutes: task.estimatedMinutes,
        });
      });
    }

    // Sort by priority and due date, return top 3
    return actions
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        
        return a.dueDate ? -1 : 1;
      })
      .slice(0, 3);
  }

  // Get predefined study categories
  getStudyCategories(): StudyCategory[] {
    return [
      {
        name: 'Music Production',
        subcategories: ['Recording', 'Mixing', 'Mastering', 'Composition', 'Music Theory'],
        color: '#8B5CF6',
        icon: '🎵',
      },
      {
        name: 'Business & Marketing',
        subcategories: ['Digital Marketing', 'Social Media', 'Brand Strategy', 'Analytics', 'Sales'],
        color: '#10B981',
        icon: '📈',
      },
      {
        name: 'Technology',
        subcategories: ['Web Development', 'Mobile Apps', 'AI/ML', 'Data Analysis', 'Automation'],
        color: '#3B82F6',
        icon: '💻',
      },
      {
        name: 'Creative Skills',
        subcategories: ['Video Editing', 'Photography', 'Graphic Design', 'Content Creation', 'Storytelling'],
        color: '#F59E0B',
        icon: '🎨',
      },
      {
        name: 'Personal Development',
        subcategories: ['Leadership', 'Communication', 'Time Management', 'Productivity', 'Mindfulness'],
        color: '#EF4444',
        icon: '🧠',
      },
      {
        name: 'Industry Knowledge',
        subcategories: ['Entertainment Industry', 'Solar Energy', 'Reality TV', 'Influencer Marketing', 'Music Business'],
        color: '#6366F1',
        icon: '🏭',
      },
    ];
  }

  // Log study time
  async logStudyTime(category: string, subcategory: string | undefined, minutes: number, notes?: string, resources?: string[]): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's already an entry for today
    const existingEntry = await db.studyTrackers
      .where(['category', 'date'])
      .equals([category, today])
      .first();

    if (existingEntry) {
      // Update existing entry
      await db.studyTrackers.update(existingEntry.id, {
        timeSpent: existingEntry.timeSpent + minutes,
        subcategory: subcategory || existingEntry.subcategory,
        notes: notes ? `${existingEntry.notes || ''}\n${notes}` : existingEntry.notes,
        resources: resources ? [...(existingEntry.resources || []), ...resources] : existingEntry.resources,
      });
    } else {
      // Create new entry
      await db.studyTrackers.add({
        id: `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category,
        subcategory,
        timeSpent: minutes,
        date: today,
        notes,
        resources,
        progress: 0, // Can be updated later by user
      });
    }
  }

  // Get study progress for all categories
  async getStudyProgress(): Promise<StudyProgress[]> {
    const categories = this.getStudyCategories();
    const progress: StudyProgress[] = [];

    for (const category of categories) {
      const streak = await this.calculateStudyStreak(category.name);
      const weeklyProgress = await this.getWeeklyStudyProgress(category.name);

      progress.push({
        category: category.name,
        totalHours: streak.totalHours,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastStudyDate: streak.lastStudyDate,
        weeklyGoal: 5, // Default 5 hours per week
        weeklyProgress: weeklyProgress,
      });
    }

    return progress;
  }

  // Calculate study streak for a category
  private async calculateStudyStreak(category: string): Promise<StudyStreak> {
    const allEntries = await db.studyTrackers
      .where('category')
      .equals(category)
      .sortBy('date');

    if (allEntries.length === 0) {
      return {
        category,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: new Date(0),
        totalHours: 0,
      };
    }

    const totalHours = allEntries.reduce((sum, entry) => sum + entry.timeSpent, 0) / 60;
    const lastStudyDate = allEntries[allEntries.length - 1].date;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group entries by date
    const entriesByDate = new Map<string, number>();
    allEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      entriesByDate.set(dateKey, (entriesByDate.get(dateKey) || 0) + entry.timeSpent);
    });

    // Convert to sorted array of dates
    const studyDates = Array.from(entriesByDate.keys())
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());

    // Calculate current streak (working backwards from today)
    const checkDate = new Date(today);
    while (checkDate >= studyDates[0]) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (entriesByDate.has(dateKey)) {
        currentStreak++;
      } else if (currentStreak > 0) {
        break; // Streak broken
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    tempStreak = 1;
    for (let i = 1; i < studyDates.length; i++) {
      const prevDate = studyDates[i - 1];
      const currDate = studyDates[i];
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      category,
      currentStreak,
      longestStreak,
      lastStudyDate,
      totalHours,
    };
  }

  // Get weekly study progress for a category
  private async getWeeklyStudyProgress(category: string): Promise<number> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyEntries = await db.studyTrackers
      .where('category')
      .equals(category)
      .and(entry => entry.date >= weekStart && entry.date < weekEnd)
      .toArray();

    const totalMinutes = weeklyEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    return totalMinutes / 60; // Convert to hours
  }

  // Get study statistics for dashboard
  async getStudyStatistics(): Promise<{
    totalHours: number;
    categoriesStudied: number;
    longestStreak: number;
    thisWeekHours: number;
  }> {
    const allEntries = await db.studyTrackers.toArray();
    const totalMinutes = allEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    const totalHours = totalMinutes / 60;

    const categoriesStudied = new Set(allEntries.map(entry => entry.category)).size;

    // Calculate longest overall streak
    const progress = await this.getStudyProgress();
    const longestStreak = Math.max(...progress.map(p => p.longestStreak), 0);

    // Calculate this week's hours
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekEntries = allEntries.filter(entry => entry.date >= weekStart);
    const thisWeekMinutes = thisWeekEntries.reduce((sum, entry) => sum + entry.timeSpent, 0);
    const thisWeekHours = thisWeekMinutes / 60;

    return {
      totalHours,
      categoriesStudied,
      longestStreak,
      thisWeekHours,
    };
  }
}

export const personalDashboardService = PersonalDashboardService.getInstance();