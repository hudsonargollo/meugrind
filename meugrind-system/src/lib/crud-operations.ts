import { db } from './database';
import { SyncableEntity } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Generic CRUD operations for all entities
export class CRUDOperations<T extends { id: string }> {
  constructor(protected tableName: keyof typeof db) {}

  async create(data: Omit<T, 'id'>): Promise<T> {
    const id = uuidv4();
    const entity = { ...data, id } as T;
    
    await (db[this.tableName] as any).add(entity);
    return entity;
  }

  async getById(id: string): Promise<T | undefined> {
    return await (db[this.tableName] as any).get(id);
  }

  async getAll(): Promise<T[]> {
    return await (db[this.tableName] as any).toArray();
  }

  async update(id: string, updates: Partial<T>): Promise<void> {
    await (db[this.tableName] as any).update(id, updates);
  }

  async delete(id: string): Promise<void> {
    await (db[this.tableName] as any).delete(id);
  }

  async bulkCreate(entities: Omit<T, 'id'>[]): Promise<T[]> {
    const entitiesWithIds = entities.map(entity => ({
      ...entity,
      id: uuidv4()
    })) as T[];
    
    await (db[this.tableName] as any).bulkAdd(entitiesWithIds);
    return entitiesWithIds;
  }

  async bulkUpdate(updates: { id: string; changes: Partial<T> }[]): Promise<void> {
    const table = db[this.tableName] as any;
    await db.transaction('rw', table, async () => {
      for (const update of updates) {
        await table.update(update.id, update.changes);
      }
    });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const table = db[this.tableName] as any;
    await table.bulkDelete(ids);
  }

  async count(): Promise<number> {
    return await (db[this.tableName] as any).count();
  }

  async clear(): Promise<void> {
    await (db[this.tableName] as any).clear();
  }
}

// Specialized CRUD operations for syncable entities
export class SyncableCRUDOperations<T extends SyncableEntity> extends CRUDOperations<T> {
  async createSyncable(data: Omit<T, keyof SyncableEntity>): Promise<T> {
    const id = uuidv4();
    const now = new Date();
    const entity = { 
      ...data, 
      id,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending' as const,
      version: 1
    } as T;
    
    await (db[this.tableName] as any).add(entity);
    return entity;
  }

  async updateSyncable(id: string, updates: Partial<Omit<T, keyof SyncableEntity>>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'pending' as const,
      version: await this.incrementVersion(id)
    };
    await (db[this.tableName] as any).update(id, updateData);
  }

  private async incrementVersion(id: string): Promise<number> {
    const entity = await this.getById(id);
    return entity ? entity.version + 1 : 1;
  }
  async getPendingSync(): Promise<T[]> {
    return await (db[this.tableName] as any)
      .where('syncStatus')
      .equals('pending')
      .toArray();
  }

  async getConflicted(): Promise<T[]> {
    return await (db[this.tableName] as any)
      .where('syncStatus')
      .equals('conflict')
      .toArray();
  }

  async markSynced(id: string): Promise<void> {
    await (db[this.tableName] as any).update(id, { syncStatus: 'synced' });
  }

  async markConflicted(id: string): Promise<void> {
    await (db[this.tableName] as any).update(id, { syncStatus: 'conflict' });
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<T[]> {
    return await (db[this.tableName] as any)
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();
  }

  async getRecentlyUpdated(since: Date): Promise<T[]> {
    return await (db[this.tableName] as any)
      .where('updatedAt')
      .above(since)
      .toArray();
  }
}

// Export specific CRUD instances for each entity type
export const userCRUD = new CRUDOperations('users');
export const eventCRUD = new SyncableCRUDOperations('events');
export const taskCRUD = new SyncableCRUDOperations('tasks');
export const syncQueueCRUD = new CRUDOperations('syncQueue');

// Band management CRUD
export const songCRUD = new CRUDOperations('songs');
export const setlistCRUD = new SyncableCRUDOperations('setlists');
export const techRiderCRUD = new CRUDOperations('techRiders');
export const contractorCRUD = new CRUDOperations('contractors');
export const gigCRUD = new SyncableCRUDOperations('gigs');
export const callSheetCRUD = new CRUDOperations('callSheets');

// Influencer CRM CRUD
export const brandDealCRUD = new SyncableCRUDOperations('brandDeals');
export const contentAssetCRUD = new CRUDOperations('contentAssets');
export const brandCRUD = new CRUDOperations('brands');
export const scriptCRUD = new CRUDOperations('scripts');

// Solar CRM CRUD
export const solarLeadCRUD = new SyncableCRUDOperations('solarLeads');
export const solarProjectCRUD = new SyncableCRUDOperations('solarProjects');
export const followupTaskCRUD = new CRUDOperations('followupTasks');

// Pomodoro timer CRUD
export const pomodoroSessionCRUD = new SyncableCRUDOperations('pomodoroSessions');
export const pomodoroStatsCRUD = new CRUDOperations('pomodoroStats');
export const studyTrackerCRUD = new CRUDOperations('studyTrackers');

// PR management CRUD
export const appearanceWindowCRUD = new SyncableCRUDOperations('appearanceWindows');
export const prEventCRUD = new SyncableCRUDOperations('prEvents');
export const talkingPointCRUD = new CRUDOperations('talkingPoints');
export const approvedNarrativeCRUD = new CRUDOperations('approvedNarratives');
export const mediaCoverageCRUD = new CRUDOperations('mediaCoverage');
export const prContractCRUD = new CRUDOperations('prContracts');