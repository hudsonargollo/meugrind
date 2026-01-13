import { syncManager } from './sync-manager';
import { SyncableEntity } from '../types';

/**
 * Offline-first service that wraps CRUD operations with sync queue management
 */
export class OfflineService {
  /**
   * Create an entity and queue for sync
   */
  async create<T extends SyncableEntity>(
    entityType: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>,
    crudOperation: (data: any) => Promise<T>
  ): Promise<T> {
    // Perform local create
    const entity = await crudOperation(data);
    
    // Queue for sync
    await syncManager.queueOperation(entityType, entity.id, 'create', entity);
    
    return entity;
  }

  /**
   * Update an entity and queue for sync
   */
  async update<T extends SyncableEntity>(
    entityType: string,
    id: string,
    updates: Partial<T>,
    crudOperation: (id: string, updates: Partial<T>) => Promise<void>
  ): Promise<void> {
    // Perform local update
    await crudOperation(id, updates);
    
    // Queue for sync
    await syncManager.queueOperation(entityType, id, 'update', updates);
  }

  /**
   * Delete an entity and queue for sync
   */
  async delete(
    entityType: string,
    id: string,
    crudOperation: (id: string) => Promise<void>
  ): Promise<void> {
    // Perform local delete
    await crudOperation(id);
    
    // Queue for sync
    await syncManager.queueOperation(entityType, id, 'delete', { id });
  }

  /**
   * Bulk create entities and queue for sync
   */
  async bulkCreate<T extends SyncableEntity>(
    entityType: string,
    entities: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'version'>[],
    crudOperation: (entities: any[]) => Promise<T[]>
  ): Promise<T[]> {
    // Perform local bulk create
    const createdEntities = await crudOperation(entities);
    
    // Queue each entity for sync
    for (const entity of createdEntities) {
      await syncManager.queueOperation(entityType, entity.id, 'create', entity);
    }
    
    return createdEntities;
  }

  /**
   * Bulk update entities and queue for sync
   */
  async bulkUpdate<T extends SyncableEntity>(
    entityType: string,
    updates: { id: string; changes: Partial<T> }[],
    crudOperation: (updates: { id: string; changes: Partial<T> }[]) => Promise<void>
  ): Promise<void> {
    // Perform local bulk update
    await crudOperation(updates);
    
    // Queue each update for sync
    for (const update of updates) {
      await syncManager.queueOperation(entityType, update.id, 'update', update.changes);
    }
  }

  /**
   * Bulk delete entities and queue for sync
   */
  async bulkDelete(
    entityType: string,
    ids: string[],
    crudOperation: (ids: string[]) => Promise<void>
  ): Promise<void> {
    // Perform local bulk delete
    await crudOperation(ids);
    
    // Queue each delete for sync
    for (const id of ids) {
      await syncManager.queueOperation(entityType, id, 'delete', { id });
    }
  }

  /**
   * Get sync status for the service
   */
  async getSyncStatus() {
    return await syncManager.getSyncStatus();
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncAll() {
    return await syncManager.forceSyncAll();
  }

  /**
   * Check if the device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Wait for online connectivity
   */
  async waitForOnline(timeout: number = 30000): Promise<boolean> {
    // Only wait in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
    
    if (navigator.onLine) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', onlineHandler);
        resolve(true);
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  /**
   * Get offline capabilities status
   */
  getOfflineCapabilities(): {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canSync: boolean;
  } {
    return {
      canCreate: true,  // Always available offline
      canRead: true,    // Always available offline
      canUpdate: true,  // Always available offline
      canDelete: true,  // Always available offline
      canSync: navigator.onLine  // Only available online
    };
  }
}

// Export singleton instance
export const offlineService = new OfflineService();