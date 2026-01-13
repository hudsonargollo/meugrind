import Dexie, { Table } from 'dexie';
import {
  User,
  Event,
  Task,
  SyncQueue,
} from '../types';
import {
  Song,
  Setlist,
  TechRider,
  Contractor,
  Gig,
  CallSheet,
} from '../types/band';
import {
  BrandDeal,
  ContentAsset,
  Brand,
  Script,
} from '../types/influencer';
import {
  SolarLead,
  SolarProject,
  FollowupTask,
} from '../types/solar';
import {
  PomodoroSession,
  PomodoroStats,
  StudyTracker,
} from '../types/pomodoro';
import {
  AppearanceWindow,
  PREvent,
  TalkingPoint,
  ApprovedNarrative,
  MediaCoverage,
  PRContract,
} from '../types/pr';

export class MEUGRINDDatabase extends Dexie {
  // Core system tables
  users!: Table<User>;
  events!: Table<Event>;
  tasks!: Table<Task>;
  syncQueue!: Table<SyncQueue>;

  // Band management tables
  songs!: Table<Song>;
  setlists!: Table<Setlist>;
  techRiders!: Table<TechRider>;
  contractors!: Table<Contractor>;
  gigs!: Table<Gig>;
  callSheets!: Table<CallSheet>;

  // Influencer CRM tables
  brandDeals!: Table<BrandDeal>;
  contentAssets!: Table<ContentAsset>;
  brands!: Table<Brand>;
  scripts!: Table<Script>;

  // Solar CRM tables
  solarLeads!: Table<SolarLead>;
  solarProjects!: Table<SolarProject>;
  followupTasks!: Table<FollowupTask>;

  // Pomodoro timer tables
  pomodoroSessions!: Table<PomodoroSession>;
  pomodoroStats!: Table<PomodoroStats>;
  studyTrackers!: Table<StudyTracker>;

  // PR management tables
  appearanceWindows!: Table<AppearanceWindow>;
  prEvents!: Table<PREvent>;
  talkingPoints!: Table<TalkingPoint>;
  approvedNarratives!: Table<ApprovedNarrative>;
  mediaCoverage!: Table<MediaCoverage>;
  prContracts!: Table<PRContract>;

  constructor() {
    super('MEUGRINDDatabase');
    
    this.version(1).stores({
      // Core system stores
      users: 'id, email, role',
      events: 'id, title, startTime, endTime, type, visibility, moduleType, createdAt, updatedAt, syncStatus',
      tasks: 'id, title, completed, priority, dueDate, category, projectId, createdAt, updatedAt, syncStatus',
      syncQueue: 'id, entityType, entityId, operation, timestamp, retryCount',

      // Band management stores
      songs: 'id, title, artist, key, bpm',
      setlists: 'id, name, gigId, createdAt, updatedAt, syncStatus',
      techRiders: 'id, setlistId, generatedAt',
      contractors: 'id, name, role, phone, email',
      gigs: 'id, venue, date, status, createdAt, updatedAt, syncStatus',
      callSheets: 'id, gigId, contractorId, date',

      // Influencer CRM stores
      brandDeals: 'id, brandName, campaignName, status, deadline, createdAt, updatedAt, syncStatus',
      contentAssets: 'id, type, platform, brandDealId, publishedAt, status',
      brands: 'id, name, blacklisted',
      scripts: 'id, title, brandDealId, contentAssetId, createdAt, updatedAt',

      // Solar CRM stores
      solarLeads: 'id, contactInfo.email, propertyType, status, followupDate, source, priority, createdAt, updatedAt, syncStatus',
      solarProjects: 'id, leadId, customerId, installationDate, permitStatus, createdAt, updatedAt, syncStatus',
      followupTasks: 'id, leadId, type, scheduledDate, completedDate',

      // Pomodoro timer stores
      pomodoroSessions: 'id, projectId, taskCategory, startTime, endTime, completed, createdAt, updatedAt, syncStatus',
      pomodoroStats: 'id, date',
      studyTrackers: 'id, category, date, timeSpent',

      // PR management stores
      appearanceWindows: 'id, contractId, showName, startDate, endDate, availabilityType, createdAt, updatedAt, syncStatus',
      prEvents: 'id, title, type, date, status, createdAt, updatedAt, syncStatus',
      talkingPoints: 'id, category, topic, approved, lastUpdated',
      approvedNarratives: 'id, title, category, approved, approvedBy, lastUsed',
      mediaCoverage: 'id, prEventId, outlet, type, publishDate, sentiment',
      prContracts: 'id, showName, network, startDate, endDate, status',
    });

    // Add hooks for automatic timestamp management
    this.events.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
      obj.syncStatus = 'pending';
      obj.version = 1;
    });

    this.events.hook('updating', function (modifications: any, primKey, obj: any, trans) {
      modifications.updatedAt = new Date();
      modifications.syncStatus = 'pending';
      if (obj.version) {
        modifications.version = obj.version + 1;
      }
    });

    // Apply the same hooks to all syncable entities
    const syncableEntities = [
      'tasks', 'setlists', 'gigs', 'brandDeals', 'solarLeads', 'solarProjects',
      'pomodoroSessions', 'appearanceWindows', 'prEvents'
    ];

    syncableEntities.forEach(entityName => {
      const table = this[entityName as keyof this] as Table<any>;
      
      table.hook('creating', function (primKey, obj, trans) {
        obj.createdAt = new Date();
        obj.updatedAt = new Date();
        obj.syncStatus = 'pending';
        obj.version = 1;
      });

      table.hook('updating', function (modifications: any, primKey, obj: any, trans) {
        modifications.updatedAt = new Date();
        modifications.syncStatus = 'pending';
        if (obj.version) {
          modifications.version = obj.version + 1;
        }
      });
    });
  }
}

// Create and export database instance
export const db = new MEUGRINDDatabase();

// Database wrapper class for unified interface
export class Database {
  private db: MEUGRINDDatabase;

  constructor() {
    this.db = db;
  }

  async create(type: string, entity: any): Promise<any> {
    const table = this.getTable(type);
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    const id = await table.add(entity);
    return { ...entity, id };
  }

  async update(type: string, id: string, entity: any): Promise<any> {
    const table = this.getTable(type);
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    await table.update(id, entity);
    return entity;
  }

  async delete(type: string, id: string): Promise<void> {
    const table = this.getTable(type);
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    await table.delete(id);
  }

  async findById(type: string, id: string): Promise<any | null> {
    const table = this.getTable(type);
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    return table.get(id) || null;
  }

  async findAll(type: string, filters?: Record<string, any>): Promise<any[]> {
    const table = this.getTable(type);
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    let collection = table.toCollection();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        collection = collection.filter((item: any) => {
          // Handle nested properties like 'contactInfo.email'
          const keys = key.split('.');
          let itemValue = item;
          for (const k of keys) {
            itemValue = itemValue?.[k];
          }
          return itemValue === value;
        });
      });
    }
    
    return collection.toArray();
  }

  async findRecentlyUpdated(userId: string, limit: number = 10): Promise<any[]> {
    // Get recently updated items from all syncable tables
    const recentItems: any[] = [];
    
    const syncableTables = [
      'tasks', 'events', 'setlists', 'gigs', 'brandDeals', 'solarLeads', 
      'solarProjects', 'pomodoroSessions', 'appearanceWindows', 'prEvents'
    ];
    
    for (const tableName of syncableTables) {
      const table = this.getTable(tableName);
      if (table) {
        const items = await table
          .orderBy('updatedAt')
          .reverse()
          .limit(limit)
          .toArray();
        
        items.forEach((item: any) => {
          recentItems.push({
            ...item,
            entityType: tableName,
          });
        });
      }
    }
    
    // Sort by updatedAt and return top items
    return recentItems
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  private getTable(type: string): any {
    const tableMap: Record<string, keyof MEUGRINDDatabase> = {
      'user': 'users',
      'event': 'events',
      'task': 'tasks',
      'song': 'songs',
      'setlist': 'setlists',
      'tech_rider': 'techRiders',
      'contractor': 'contractors',
      'gig': 'gigs',
      'call_sheet': 'callSheets',
      'brand_deal': 'brandDeals',
      'content_asset': 'contentAssets',
      'brand': 'brands',
      'script': 'scripts',
      'solar_lead': 'solarLeads',
      'solar_project': 'solarProjects',
      'followup_task': 'followupTasks',
      'pomodoro_session': 'pomodoroSessions',
      'pomodoro_stats': 'pomodoroStats',
      'study_tracker': 'studyTrackers',
      'appearance_window': 'appearanceWindows',
      'pr_event': 'prEvents',
      'talking_point': 'talkingPoints',
      'approved_narrative': 'approvedNarratives',
      'media_coverage': 'mediaCoverage',
      'pr_contract': 'prContracts',
    };

    const tableName = tableMap[type];
    return tableName ? this.db[tableName] : null;
  }
}