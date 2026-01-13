import { db } from './database';
import { SyncQueue, SyncableEntity } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { powerManager } from './power-management';
import { supabaseSyncService, SupabaseSyncResult } from './supabase-sync-service';
import { isSupabaseConfigured } from './supabase-config';

export interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  conflictFields: string[];
  timestamp: Date;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: string[];
}

export class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private ecoModeActive: boolean = false;
  private syncPaused: boolean = false;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.initiateSyncProcess();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for eco mode changes
    window.addEventListener('ecoModeChanged', (event: any) => {
      this.ecoModeActive = event.detail.active;
      this.syncPaused = event.detail.active && event.detail.level === 'aggressive';
      
      if (this.syncPaused) {
        console.log('Sync paused due to aggressive power saving mode');
      } else if (this.ecoModeActive) {
        console.log('Sync throttled due to eco mode');
      }
    });
  }

  /**
   * Add an operation to the sync queue - now delegates to Supabase service
   */
  async queueOperation(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      // Use Supabase sync service
      await supabaseSyncService.queueOperation(entityType, entityId, operation, data);
    } else {
      // Fallback to local queue only
      const syncItem: SyncQueue = {
        id: uuidv4(),
        entityType,
        entityId,
        operation,
        data,
        timestamp: new Date(),
        retryCount: 0
      };

      await db.syncQueue.add(syncItem);
      console.log('Operation queued locally (Supabase not configured)');
    }
  }

  /**
   * Initiate the sync process - now delegates to Supabase sync service
   */
  async initiateSyncProcess(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - using fallback sync simulation');
      return this.fallbackSyncProcess();
    }

    // Delegate to Supabase sync service
    const supabaseResult = await supabaseSyncService.initiateSyncProcess();
    
    // Convert Supabase result to our format
    return {
      success: supabaseResult.success,
      synced: supabaseResult.synced,
      conflicts: supabaseResult.conflicts,
      errors: supabaseResult.errors
    };
  }

  /**
   * Fallback sync process for when Supabase is not configured
   */
  private async fallbackSyncProcess(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync already in progress or offline'] };
    }

    // Check power management constraints
    if (this.syncPaused) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync paused due to power saving mode'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      conflicts: 0,
      errors: []
    };

    try {
      // Get resource optimizations from power manager
      const optimizations = powerManager.getResourceOptimizations();
      
      // Get all pending sync operations
      const pendingOperations = await db.syncQueue
        .orderBy('timestamp')
        .toArray();

      console.log(`Starting sync process with ${pendingOperations.length} pending operations`);

      // Limit concurrent operations based on power state
      const maxConcurrent = this.ecoModeActive ? 
        Math.min(optimizations.maxConcurrentOperations, 2) : 
        optimizations.maxConcurrentOperations;

      // Process operations in batches to respect power constraints
      for (let i = 0; i < pendingOperations.length; i += maxConcurrent) {
        const batch = pendingOperations.slice(i, i + maxConcurrent);
        
        // Process batch concurrently
        const batchPromises = batch.map(async (operation) => {
          try {
            const syncSuccess = await this.syncOperation(operation);
            if (syncSuccess) {
              await db.syncQueue.delete(operation.id);
              result.synced++;
            } else {
              // Increment retry count
              await db.syncQueue.update(operation.id, {
                retryCount: operation.retryCount + 1
              });

              // Schedule retry with exponential backoff
              this.scheduleRetry(operation);
            }
          } catch (error) {
            console.error(`Failed to sync operation ${operation.id}:`, error);
            result.errors.push(`Operation ${operation.id}: ${error}`);
            
            // Mark as conflict if too many retries
            if (operation.retryCount >= 3) {
              await this.handleSyncConflict(operation, error as Error);
              await db.syncQueue.delete(operation.id);
              result.conflicts++;
            }
          }
        });

        await Promise.all(batchPromises);

        // Add delay between batches in eco mode
        if (this.ecoModeActive && i + maxConcurrent < pendingOperations.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Perform delta sync for recently updated entities (skip in aggressive power saving)
      if (!this.syncPaused) {
        await this.performDeltaSync();
      }

    } catch (error) {
      console.error('Sync process failed:', error);
      result.success = false;
      result.errors.push(`Sync process: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: SyncQueue): Promise<boolean> {
    // This would normally make API calls to the remote server
    // For now, we'll simulate the sync process
    
    console.log(`Syncing ${operation.operation} operation for ${operation.entityType}:${operation.entityId}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate success/failure (90% success rate for demo)
    const success = Math.random() > 0.1;
    
    if (success) {
      // Mark the entity as synced in the local database
      const table = this.getTableForEntityType(operation.entityType);
      if (table) {
        await table.update(operation.entityId, { syncStatus: 'synced' });
      }
    }

    return success;
  }

  /**
   * Perform delta synchronization
   */
  private async performDeltaSync(): Promise<void> {
    const syncableTables = [
      'events', 'tasks', 'setlists', 'gigs', 'brandDeals',
      'solarLeads', 'solarProjects', 'pomodoroSessions',
      'appearanceWindows', 'prEvents'
    ];

    for (const tableName of syncableTables) {
      try {
        const table = db[tableName as keyof typeof db] as any;
        
        // Get entities that need syncing (pending or recently updated)
        const pendingEntities = await table
          .where('syncStatus')
          .equals('pending')
          .toArray();

        for (const entity of pendingEntities) {
          // Create delta containing only changed fields
          const delta = this.createDelta(entity);
          
          // Queue the delta for sync
          await this.queueOperation(tableName, entity.id, 'update', delta);
        }
      } catch (error) {
        console.error(`Delta sync failed for ${tableName}:`, error);
      }
    }
  }

  /**
   * Create a delta object containing only changed fields
   */
  private createDelta(entity: SyncableEntity): Partial<SyncableEntity> {
    // In a real implementation, this would compare with the last synced version
    // For now, we'll return the essential fields that always need syncing
    return {
      id: entity.id,
      updatedAt: entity.updatedAt,
      version: entity.version
    };
  }

  /**
   * Handle sync conflicts
   */
  private async handleSyncConflict(operation: SyncQueue, error: Error): Promise<void> {
    const conflict: SyncConflict = {
      id: uuidv4(),
      entityType: operation.entityType,
      entityId: operation.entityId,
      localVersion: operation.data,
      remoteVersion: null, // Would be fetched from server
      conflictFields: [], // Would be determined by comparing versions
      timestamp: new Date()
    };

    // Store conflict for manual resolution
    await db.transaction('rw', [db.syncQueue], async () => {
      // Mark entity as conflicted
      const table = this.getTableForEntityType(operation.entityType);
      if (table) {
        await table.update(operation.entityId, { syncStatus: 'conflict' });
      }
    });

    console.log(`Sync conflict created for ${operation.entityType}:${operation.entityId}`);
  }

  /**
   * Resolve a sync conflict using different strategies
   */
  async resolveConflict(
    conflictId: string,
    strategy: 'local_wins' | 'remote_wins' | 'manual_merge',
    mergedData?: any
  ): Promise<void> {
    // Implementation would depend on the specific conflict resolution strategy
    console.log(`Resolving conflict ${conflictId} with strategy: ${strategy}`);
    
    // For manual merge, use the provided merged data
    if (strategy === 'manual_merge' && mergedData) {
      // Apply the merged data and mark as resolved
      // Implementation would update the entity and mark as synced
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(operation: SyncQueue): void {
    // Increase delay in eco mode
    const baseDelay = this.ecoModeActive ? 2000 : 1000;
    const delay = Math.min(baseDelay * Math.pow(2, operation.retryCount), 60000); // Max 60 seconds in eco mode
    
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(operation.id);
      if (this.isOnline && !this.syncPaused) {
        this.initiateSyncProcess();
      }
    }, delay);

    this.retryTimeouts.set(operation.id, timeoutId);
  }

  /**
   * Get the appropriate table for an entity type
   */
  private getTableForEntityType(entityType: string): any {
    const tableMap: { [key: string]: any } = {
      'events': db.events,
      'tasks': db.tasks,
      'setlists': db.setlists,
      'gigs': db.gigs,
      'brandDeals': db.brandDeals,
      'solarLeads': db.solarLeads,
      'solarProjects': db.solarProjects,
      'pomodoroSessions': db.pomodoroSessions,
      'appearanceWindows': db.appearanceWindows,
      'prEvents': db.prEvents
    };

    return tableMap[entityType];
  }

  /**
   * Get sync status - now includes Supabase status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    pendingOperations: number;
    conflicts: number;
    lastSync?: Date;
    ecoModeActive: boolean;
    syncPaused: boolean;
    supabaseConfigured?: boolean;
  }> {
    if (isSupabaseConfigured()) {
      // Get status from Supabase sync service
      return await supabaseSyncService.getSyncStatus();
    } else {
      // Fallback to local status
      const pendingCount = await db.syncQueue.count();
      
      // Count conflicts across all syncable tables
      let conflictCount = 0;
      const syncableTables = [
        'events', 'tasks', 'setlists', 'gigs', 'brandDeals',
        'solarLeads', 'solarProjects', 'pomodoroSessions',
        'appearanceWindows', 'prEvents'
      ];

      for (const tableName of syncableTables) {
        const table = db[tableName as keyof typeof db] as any;
        const conflicts = await table.where('syncStatus').equals('conflict').count();
        conflictCount += conflicts;
      }

      return {
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        pendingOperations: pendingCount,
        conflicts: conflictCount,
        ecoModeActive: this.ecoModeActive,
        syncPaused: this.syncPaused,
        supabaseConfigured: false
      };
    }
  }

  /**
   * Force sync all pending operations - delegates to Supabase service
   */
  async forceSyncAll(): Promise<SyncResult> {
    if (isSupabaseConfigured()) {
      const supabaseResult = await supabaseSyncService.forceSyncAll();
      return {
        success: supabaseResult.success,
        synced: supabaseResult.synced,
        conflicts: supabaseResult.conflicts,
        errors: supabaseResult.errors
      };
    } else {
      return await this.fallbackSyncProcess();
    }
  }

  /**
   * Clear all sync conflicts - delegates to Supabase service
   */
  async clearAllConflicts(): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabaseSyncService.clearAllConflicts();
    } else {
      const syncableTables = [
        'events', 'tasks', 'setlists', 'gigs', 'brandDeals',
        'solarLeads', 'solarProjects', 'pomodoroSessions',
        'appearanceWindows', 'prEvents'
      ];

      for (const tableName of syncableTables) {
        const table = db[tableName as keyof typeof db] as any;
        const conflictedEntities = await table.where('syncStatus').equals('conflict').toArray();
        
        for (const entity of conflictedEntities) {
          await table.update(entity.id, { syncStatus: 'pending' });
        }
      }

      console.log('All sync conflicts cleared (local only)');
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();