import { Database } from './database';
import { SyncManager } from './sync-manager';
import { cacheManager } from './cache-manager';
import { performanceMonitor } from './performance-monitor';

// Import all service types
import type { Song, Setlist, TechRider, Contractor } from '../types/band';
import type { BrandDeal, ContentAsset } from '../types/influencer';
import type { SolarLead, SolarProject } from '../types/solar';
import type { PomodoroSession } from '../types/pomodoro';
import type { PREvent, AppearanceWindow, TalkingPoint } from '../types/pr';

export interface UnifiedEntity {
  id: string;
  type: 'song' | 'setlist' | 'brand_deal' | 'solar_lead' | 'pomodoro_session' | 'pr_event' | 'task' | 'event';
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
  version: number;
  userId: string;
}

export interface Task extends UnifiedEntity {
  type: 'task';
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  moduleId?: string;
  entityId?: string;
  tags: string[];
}

export interface Event extends UnifiedEntity {
  type: 'event';
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  visibility: 'fyi' | 'mandatory' | 'private';
  moduleId?: string;
  entityId?: string;
  attendees: string[];
}

class UnifiedDataService {
  private db: Database;
  private syncManager: SyncManager;
  private cacheManager = cacheManager;

  constructor() {
    this.db = new Database();
    this.syncManager = new SyncManager();
  }

  // Generic CRUD operations
  async create<T extends UnifiedEntity>(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>): Promise<T> {
    return performanceMonitor.measureAsync(`create_${entity.type}`, async () => {
      const now = new Date();
      const newEntity = {
        ...entity,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending' as const,
        version: 1,
      } as T;

      await this.db.create(entity.type, newEntity);
      await this.syncManager.queueOperation(entity.type, newEntity.id, 'create', newEntity);
      
      return newEntity;
    });
  }

  async update<T extends UnifiedEntity>(type: string, id: string, updates: Partial<T>): Promise<T> {
    return performanceMonitor.measureAsync(`update_${type}`, async () => {
      const existing = await this.db.findById(type, id);
      if (!existing) {
        throw new Error(`Entity not found: ${type}/${id}`);
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        syncStatus: 'pending' as const,
        version: existing.version + 1,
      } as T;

      await this.db.update(type, id, updated);
      await this.syncManager.queueOperation(type, id, 'update', updated);
      
      return updated;
    });
  }
  async delete(type: string, id: string): Promise<void> {
    return performanceMonitor.measureAsync(`delete_${type}`, async () => {
      await this.db.delete(type, id);
      await this.syncManager.queueOperation(type, id, 'delete', null);
    });
  }

  async findById<T extends UnifiedEntity>(type: string, id: string): Promise<T | null> {
    return performanceMonitor.measureAsync(`findById_${type}`, async () => {
      // Try cache first
      const cached = await this.cacheManager.get(`${type}:${id}`);
      if (cached) {
        return cached as T;
      }

      // Fallback to database
      const entity = await this.db.findById(type, id);
      if (entity) {
        await this.cacheManager.set(`${type}:${id}`, entity, { ttl: 300 }); // 5 min cache
      }
      
      return entity as T;
    });
  }

  async findAll<T extends UnifiedEntity>(type: string, filters?: Record<string, any>): Promise<T[]> {
    return performanceMonitor.measureAsync(`findAll_${type}`, async () => {
      return this.db.findAll(type, filters) as Promise<T[]>;
    });
  }

  async findByUser<T extends UnifiedEntity>(type: string, userId: string): Promise<T[]> {
    return this.db.findAll(type, { userId }) as Promise<T[]>;
  }

  // Cross-module operations
  async createTaskFromEntity(entityType: string, entityId: string, taskData: Partial<Task>): Promise<Task> {
    return this.create<Task>({
      ...taskData,
      type: 'task',
      moduleId: entityType,
      entityId: entityId,
      title: taskData.title || `Task for ${entityType}`,
      completed: false,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      userId: taskData.userId || '',
    });
  }

  async createEventFromEntity(entityType: string, entityId: string, eventData: Partial<Event>): Promise<Event> {
    const eventDataAny = eventData as any;
    return this.create<Event>({
      ...eventData,
      type: 'personal' as any,
      moduleId: entityType,
      entityId: entityId,
      title: eventDataAny.title || `Event for ${entityType}`,
      startTime: eventDataAny.startTime || new Date(),
      endTime: eventDataAny.endTime || new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
      visibility: eventDataAny.visibility || 'fyi_only',
      createdBy: eventDataAny.createdBy || '',
    } as any);
  }

  async getRelatedTasks(entityType: string, entityId: string): Promise<Task[]> {
    return this.findAll<Task>('task', { moduleId: entityType, entityId });
  }

  async getRelatedEvents(entityType: string, entityId: string): Promise<Event[]> {
    return this.findAll<Event>('event', { moduleId: entityType, entityId });
  }

  // Dashboard data aggregation
  async getDashboardData(userId: string, role: 'manager' | 'personal') {
    const [tasks, events, recentActivity] = await Promise.all([
      this.getUpcomingTasks(userId, role),
      this.getUpcomingEvents(userId, role),
      this.getRecentActivity(userId, role),
    ]);

    return {
      tasks,
      events,
      recentActivity,
      stats: await this.getStats(userId, role),
    };
  }

  private async getUpcomingTasks(userId: string, role: 'manager' | 'personal'): Promise<Task[]> {
    const allTasks = await this.findByUser<Task>('task', userId);
    return allTasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Sort by priority and due date
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return a.dueDate ? -1 : 1;
      })
      .slice(0, role === 'personal' ? 3 : 10);
  }

  private async getUpcomingEvents(userId: string, role: 'manager' | 'personal'): Promise<Event[]> {
    const allEvents = await this.findByUser<Event>('event', userId);
    const now = new Date();
    
    return allEvents
      .filter(event => {
        // Filter by visibility based on role
        if (role === 'personal' && event.visibility === 'private') {
          return false;
        }
        return event.startDate > now;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 5);
  }

  private async getRecentActivity(userId: string, role: 'manager' | 'personal') {
    // Get recently updated entities across all modules
    const recentlyUpdated = await this.db.findRecentlyUpdated(userId, 10);
    return recentlyUpdated;
  }

  private async getStats(userId: string, role: 'manager' | 'personal') {
    const [taskStats, eventStats, moduleStats] = await Promise.all([
      this.getTaskStats(userId),
      this.getEventStats(userId),
      this.getModuleStats(userId, role),
    ]);

    return {
      tasks: taskStats,
      events: eventStats,
      modules: moduleStats,
    };
  }

  private async getTaskStats(userId: string) {
    const tasks = await this.findByUser<Task>('task', userId);
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < new Date()).length;
    
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
      overdue,
    };
  }

  private async getEventStats(userId: string) {
    const events = await this.findByUser<Event>('event', userId);
    const now = new Date();
    const upcoming = events.filter(e => e.startDate > now).length;
    const today = events.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate.toDateString() === now.toDateString();
    }).length;

    return {
      total: events.length,
      upcoming,
      today,
    };
  }

  private async getModuleStats(userId: string, role: 'manager' | 'personal') {
    // Get counts for each module
    const [songs, setlists, brandDeals, solarLeads, pomodoroSessions] = await Promise.all([
      this.findByUser('song', userId),
      this.findByUser('setlist', userId),
      this.findByUser('brand_deal', userId),
      this.findByUser('solar_lead', userId),
      this.findByUser('pomodoro_session', userId),
    ]);

    return {
      band: {
        songs: songs.length,
        setlists: setlists.length,
      },
      influencer: {
        brandDeals: brandDeals.length,
        activeCampaigns: brandDeals.filter((deal: any) => 
          ['contract', 'content', 'posted'].includes(deal.status)
        ).length,
      },
      solar: {
        leads: solarLeads.length,
        activeProjects: solarLeads.filter((lead: any) => 
          ['qualified', 'assessment', 'proposal', 'contract'].includes(lead.status)
        ).length,
      },
      pomodoro: {
        totalSessions: pomodoroSessions.length,
        thisWeek: pomodoroSessions.filter((session: any) => {
          const sessionDate = new Date(session.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sessionDate > weekAgo;
        }).length,
      },
    };
  }

  // Sync management
  async forceSyncAll(): Promise<void> {
    await this.syncManager.forceSyncAll();
  }

  async getSyncStatus() {
    return this.syncManager.getSyncStatus();
  }

  // Cache management
  async clearCache(): Promise<void> {
    await this.cacheManager.clear();
  }
}

// Singleton instance
export const unifiedDataService = new UnifiedDataService();
export default unifiedDataService;