import { supabase, isSupabaseConfigured, getTableName } from './supabase-config';
import { db } from './database';
import { SyncQueue, SyncableEntity } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { powerManager } from './power-management';
import { connectivityService } from './connectivity-service';

export interface SupabaseSyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  conflictFields: string[];
  timestamp: Date;
}

export interface SupabaseSyncResult {
  success: boolean;
  synced: number;
  conflicts: number;
  errors: string[];
}

export class SupabaseSyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private ecoModeActive: boolean = false;
  private syncPaused: boolean = false;
  private realtimeSubscriptions: Map<string, any> = new Map();

  constructor() {
    // Listen for connectivity changes from connectivity service
    connectivityService.addListener((info) => {
      const wasOnline = this.isOnline;
      this.isOnline = info.status === 'online';
      
      // Trigger sync when coming online
      if (!wasOnline && this.isOnline && isSupabaseConfigured()) {
        this.initiateSyncProcess();
      }
    });

    // Listen for eco mode changes (only in browser environment)
    if (typeof window !== 'undefined') {
      window.addEventListener('ecoModeChanged', (event: any) => {
        this.ecoModeActive = event.detail.active;
        this.syncPaused = event.detail.active && event.detail.level === 'aggressive';
        
        if (this.syncPaused) {
          console.log('Supabase sync paused due to aggressive power saving mode');
          this.unsubscribeFromRealtime();
        } else if (this.ecoModeActive) {
          console.log('Supabase sync throttled due to eco mode');
        } else {
          this.subscribeToRealtime();
        }
      });
    }

    // Initialize realtime subscriptions if configured
    if (isSupabaseConfigured()) {
      this.subscribeToRealtime();
    }
  }

  /**
   * Subscribe to realtime updates from Supabase
   */
  private subscribeToRealtime(): void {
    if (!isSupabaseConfigured() || this.syncPaused) return;

    const syncableTables = [
      'events', 'tasks', 'setlists', 'gigs', 'brand_deals',
      'solar_leads', 'solar_projects', 'pomodoro_sessions',
      'appearance_windows', 'pr_events'
    ];

    syncableTables.forEach(tableName => {
      const supabaseTableName = getTableName(tableName);
      
      const subscription = supabase
        .channel(`${tableName}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: supabaseTableName,
          },
          (payload) => {
            this.handleRealtimeUpdate(tableName, payload);
          }
        )
        .subscribe();

      this.realtimeSubscriptions.set(tableName, subscription);
    });

    console.log('Subscribed to Supabase realtime updates');
  }

  /**
   * Unsubscribe from realtime updates
   */
  private unsubscribeFromRealtime(): void {
    this.realtimeSubscriptions.forEach((subscription, tableName) => {
      supabase.removeChannel(subscription);
    });
    this.realtimeSubscriptions.clear();
    console.log('Unsubscribed from Supabase realtime updates');
  }

  /**
   * Handle realtime updates from Supabase
   */
  private async handleRealtimeUpdate(tableName: string, payload: any): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
          await this.mergeRemoteRecord(tableName, newRecord);
          break;
        case 'DELETE':
          await this.handleRemoteDelete(tableName, oldRecord.id);
          break;
      }
    } catch (error) {
      console.error(`Failed to handle realtime update for ${tableName}:`, error);
    }
  }

  /**
   * Merge a remote record into local database
   */
  private async mergeRemoteRecord(tableName: string, remoteRecord: any): Promise<void> {
    const table = this.getTableForEntityType(tableName);
    if (!table) return;

    try {
      // Get local record if it exists
      const localRecord = await table.get(remoteRecord.id);
      
      if (!localRecord) {
        // New record from remote - add to local database
        const localData = this.convertFromSupabaseFormat(remoteRecord);
        await table.add(localData);
        console.log(`Added new remote record to ${tableName}:`, remoteRecord.id);
      } else {
        // Check for conflicts
        if (localRecord.syncStatus === 'pending' && localRecord.version !== remoteRecord.version) {
          // Conflict detected - handle based on strategy
          await this.handleSyncConflict(tableName, localRecord, remoteRecord);
        } else {
          // No conflict - update local record
          const localData = this.convertFromSupabaseFormat(remoteRecord);
          await table.update(remoteRecord.id, { ...localData, syncStatus: 'synced' });
          console.log(`Updated local record from remote in ${tableName}:`, remoteRecord.id);
        }
      }
    } catch (error) {
      console.error(`Failed to merge remote record in ${tableName}:`, error);
    }
  }

  /**
   * Handle remote delete
   */
  private async handleRemoteDelete(tableName: string, recordId: string): Promise<void> {
    const table = this.getTableForEntityType(tableName);
    if (!table) return;

    try {
      await table.delete(recordId);
      console.log(`Deleted record from ${tableName}:`, recordId);
    } catch (error) {
      console.error(`Failed to delete record from ${tableName}:`, error);
    }
  }

  /**
   * Add an operation to the sync queue
   */
  async queueOperation(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - operation queued for local only');
      return;
    }

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

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.initiateSyncProcess();
    }
  }

  /**
   * Initiate the sync process with Supabase
   */
  async initiateSyncProcess(): Promise<SupabaseSyncResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Supabase not configured'] };
    }

    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync already in progress or offline'] };
    }

    // Check power management constraints
    if (this.syncPaused) {
      return { success: false, synced: 0, conflicts: 0, errors: ['Sync paused due to power saving mode'] };
    }

    this.syncInProgress = true;
    const result: SupabaseSyncResult = {
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

      console.log(`Starting Supabase sync process with ${pendingOperations.length} pending operations`);

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
            const syncSuccess = await this.syncOperationToSupabase(operation);
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
            console.error(`Failed to sync operation ${operation.id} to Supabase:`, error);
            result.errors.push(`Operation ${operation.id}: ${error}`);
            
            // Mark as conflict if too many retries
            if (operation.retryCount >= 3) {
              await this.handleSyncConflict(operation.entityType, operation.data, null);
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
      console.error('Supabase sync process failed:', error);
      result.success = false;
      result.errors.push(`Sync process: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Sync a single operation to Supabase
   */
  private async syncOperationToSupabase(operation: SyncQueue): Promise<boolean> {
    const tableName = getTableName(operation.entityType);
    const supabaseData = this.convertToSupabaseFormat(operation.data);
    
    console.log(`Syncing ${operation.operation} operation for ${operation.entityType}:${operation.entityId} to Supabase`);

    try {
      let result;
      
      switch (operation.operation) {
        case 'create':
          result = await supabase
            .from(tableName)
            .insert(supabaseData)
            .select();
          break;
          
        case 'update':
          result = await supabase
            .from(tableName)
            .update(supabaseData)
            .eq('id', operation.entityId)
            .select();
          break;
          
        case 'delete':
          result = await supabase
            .from(tableName)
            .delete()
            .eq('id', operation.entityId);
          break;
      }

      if (result?.error) {
        console.error(`Supabase operation failed:`, result.error);
        return false;
      }

      // Mark the entity as synced in the local database
      const table = this.getTableForEntityType(operation.entityType);
      if (table && operation.operation !== 'delete') {
        await table.update(operation.entityId, { syncStatus: 'synced' });
      }

      return true;
    } catch (error) {
      console.error(`Failed to sync to Supabase:`, error);
      return false;
    }
  }

  /**
   * Perform delta synchronization from Supabase
   */
  private async performDeltaSync(): Promise<void> {
    const syncableTables = [
      'events', 'tasks', 'setlists', 'gigs', 'brand_deals',
      'solar_leads', 'solar_projects', 'pomodoro_sessions',
      'appearance_windows', 'pr_events'
    ];

    for (const tableName of syncableTables) {
      try {
        const supabaseTableName = getTableName(tableName);
        
        // Get the last sync timestamp for this table (simplified - could be stored in local storage)
        const lastSync = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours for demo
        
        // Fetch recent changes from Supabase
        const { data: remoteRecords, error } = await supabase
          .from(supabaseTableName)
          .select('*')
          .gte('updated_at', lastSync.toISOString())
          .order('updated_at', { ascending: true });

        if (error) {
          console.error(`Failed to fetch delta sync for ${tableName}:`, error);
          continue;
        }

        // Merge remote records with local database
        for (const remoteRecord of remoteRecords || []) {
          await this.mergeRemoteRecord(tableName, remoteRecord);
        }

      } catch (error) {
        console.error(`Delta sync failed for ${tableName}:`, error);
      }
    }
  }

  /**
   * Handle sync conflicts using different strategies
   */
  private async handleSyncConflict(
    entityType: string,
    localData: any,
    remoteData: any
  ): Promise<void> {
    const conflict: SupabaseSyncConflict = {
      id: uuidv4(),
      entityType,
      entityId: localData.id,
      localVersion: localData,
      remoteVersion: remoteData,
      conflictFields: this.identifyConflictFields(localData, remoteData),
      timestamp: new Date()
    };

    // Store conflict for manual resolution
    const table = this.getTableForEntityType(entityType);
    if (table) {
      await table.update(localData.id, { syncStatus: 'conflict' });
    }

    console.log(`Supabase sync conflict created for ${entityType}:${localData.id}`);
    
    // Emit event for UI to handle conflict resolution
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syncConflict', { detail: conflict }));
    }
  }

  /**
   * Identify conflicting fields between local and remote data
   */
  private identifyConflictFields(localData: any, remoteData: any): string[] {
    if (!remoteData) return [];
    
    const conflicts: string[] = [];
    const excludeFields = ['id', 'createdAt', 'updatedAt', 'syncStatus', 'version'];
    
    Object.keys(localData).forEach(key => {
      if (!excludeFields.includes(key) && localData[key] !== remoteData[key]) {
        conflicts.push(key);
      }
    });
    
    return conflicts;
  }

  /**
   * Convert local data format to Supabase format
   */
  private convertToSupabaseFormat(data: any): any {
    const converted = { ...data };
    
    // Convert camelCase to snake_case for Supabase
    const convertedData: any = {};
    Object.keys(converted).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      convertedData[snakeKey] = converted[key];
    });
    
    return convertedData;
  }

  /**
   * Convert Supabase format to local data format
   */
  private convertFromSupabaseFormat(data: any): any {
    const converted: any = {};
    
    // Convert snake_case to camelCase for local use
    Object.keys(data).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = data[key];
    });
    
    return converted;
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(operation: SyncQueue): void {
    // Increase delay in eco mode
    const baseDelay = this.ecoModeActive ? 2000 : 1000;
    const delay = Math.min(baseDelay * Math.pow(2, operation.retryCount), 60000); // Max 60 seconds
    
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(operation.id);
      if (this.isOnline && !this.syncPaused && isSupabaseConfigured()) {
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
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    syncInProgress: boolean;
    pendingOperations: number;
    conflicts: number;
    lastSync?: Date;
    ecoModeActive: boolean;
    syncPaused: boolean;
    supabaseConfigured: boolean;
  }> {
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
      supabaseConfigured: isSupabaseConfigured()
    };
  }

  /**
   * Force sync all pending operations
   */
  async forceSyncAll(): Promise<SupabaseSyncResult> {
    return await this.initiateSyncProcess();
  }

  /**
   * Clear all sync conflicts (for testing/recovery)
   */
  async clearAllConflicts(): Promise<void> {
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

    console.log('All Supabase sync conflicts cleared');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.unsubscribeFromRealtime();
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts.clear();
  }
}

// Export singleton instance
export const supabaseSyncService = new SupabaseSyncService();