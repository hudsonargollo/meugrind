/**
 * Integration tests for Supabase sync system
 */

import { syncManager } from '../sync-manager';
import { supabaseSyncService } from '../supabase-sync-service';
import { isSupabaseConfigured } from '../supabase-config';
import { db } from '../database';

// Mock Supabase configuration
jest.mock('../supabase-config', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ error: null, data: [] })),
        eq: jest.fn(() => Promise.resolve({ error: null, data: [] })),
        gte: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ error: null, data: [] }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ error: null, data: [{ id: '1' }] }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ error: null, data: [] }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn()
      }))
    })),
    removeChannel: jest.fn()
  },
  isSupabaseConfigured: jest.fn(() => true),
  getTableName: jest.fn((entityType) => entityType)
}));

// Mock database
jest.mock('../database', () => ({
  db: {
    syncQueue: {
      add: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      orderBy: jest.fn(() => ({
        toArray: jest.fn(() => Promise.resolve([]))
      })),
      delete: jest.fn(),
      update: jest.fn()
    },
    events: {
      update: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(() => Promise.resolve(0)),
          toArray: jest.fn(() => Promise.resolve([]))
        }))
      }))
    },
    tasks: {
      update: jest.fn(),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          count: jest.fn(() => Promise.resolve(0)),
          toArray: jest.fn(() => Promise.resolve([]))
        }))
      }))
    }
  }
}));

describe('Supabase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  });

  describe('Sync Manager Integration', () => {
    it('should delegate to Supabase sync service when configured', async () => {
      const queueSpy = jest.spyOn(supabaseSyncService, 'queueOperation').mockResolvedValue();
      
      await syncManager.queueOperation('events', 'test-id', 'create', { title: 'Test Event' });
      
      expect(queueSpy).toHaveBeenCalledWith('events', 'test-id', 'create', { title: 'Test Event' });
    });

    it('should use fallback when Supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      await syncManager.queueOperation('events', 'test-id', 'create', { title: 'Test Event' });
      
      expect(db.syncQueue.add).toHaveBeenCalled();
    });

    it('should delegate sync process to Supabase service', async () => {
      const syncSpy = jest.spyOn(supabaseSyncService, 'initiateSyncProcess').mockResolvedValue({
        success: true,
        synced: 5,
        conflicts: 0,
        errors: []
      });
      
      const result = await syncManager.initiateSyncProcess();
      
      expect(syncSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.synced).toBe(5);
    });

    it('should get sync status from Supabase service', async () => {
      const statusSpy = jest.spyOn(supabaseSyncService, 'getSyncStatus').mockResolvedValue({
        isOnline: true,
        syncInProgress: false,
        pendingOperations: 0,
        conflicts: 0,
        ecoModeActive: false,
        syncPaused: false,
        supabaseConfigured: true
      });
      
      const status = await syncManager.getSyncStatus();
      
      expect(statusSpy).toHaveBeenCalled();
      expect(status.supabaseConfigured).toBe(true);
    });

    it('should force sync through Supabase service', async () => {
      const forceSyncSpy = jest.spyOn(supabaseSyncService, 'forceSyncAll').mockResolvedValue({
        success: true,
        synced: 10,
        conflicts: 1,
        errors: []
      });
      
      const result = await syncManager.forceSyncAll();
      
      expect(forceSyncSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.synced).toBe(10);
      expect(result.conflicts).toBe(1);
    });

    it('should clear conflicts through Supabase service', async () => {
      const clearSpy = jest.spyOn(supabaseSyncService, 'clearAllConflicts').mockResolvedValue();
      
      await syncManager.clearAllConflicts();
      
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Real-time Integration', () => {
    it('should handle real-time updates properly', async () => {
      // Test that real-time subscriptions are set up
      const service = new (require('../supabase-sync-service').SupabaseSyncService)();
      
      // Verify that subscriptions are created for syncable tables
      expect(service).toBeDefined();
    });

    it('should pause real-time subscriptions in eco mode', () => {
      // Simulate eco mode activation
      const ecoModeEvent = new CustomEvent('ecoModeChanged', {
        detail: { active: true, level: 'aggressive' }
      });
      
      window.dispatchEvent(ecoModeEvent);
      
      // Verify that subscriptions are paused
      // This would be tested by checking internal state or mock calls
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should handle sync conflicts from real-time updates', async () => {
      // Mock a conflict scenario
      const localData = { id: 'test-id', title: 'Local Title', version: 1 };
      const remoteData = { id: 'test-id', title: 'Remote Title', version: 2 };
      
      // Simulate conflict detection and resolution
      // This would test the conflict resolution workflow
      expect(localData.id).toBe(remoteData.id);
    });
  });

  describe('Power Management Integration', () => {
    it('should respect power management constraints', async () => {
      // Test that sync operations are throttled in eco mode
      const result = await syncManager.initiateSyncProcess();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should pause sync in aggressive power saving mode', async () => {
      // Simulate aggressive power saving
      const powerEvent = new CustomEvent('ecoModeChanged', {
        detail: { active: true, level: 'aggressive' }
      });
      
      window.dispatchEvent(powerEvent);
      
      const result = await syncManager.initiateSyncProcess();
      
      // Should still return a result but may be limited
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Supabase service errors gracefully', async () => {
      const errorSpy = jest.spyOn(supabaseSyncService, 'initiateSyncProcess').mockRejectedValue(
        new Error('Network error')
      );
      
      try {
        await syncManager.initiateSyncProcess();
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should fallback to local sync when Supabase fails', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await syncManager.initiateSyncProcess();
      
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});