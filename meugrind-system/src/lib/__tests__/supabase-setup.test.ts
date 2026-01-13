/**
 * Tests for Supabase database setup utilities
 */

import {
  validateDatabaseSetup,
  testDatabaseOperations,
  getDatabaseStats,
  initializeDefaultData,
  checkSupabaseHealth,
  setupSupabaseDatabase
} from '../supabase-setup';
import { isSupabaseConfigured } from '../supabase-config';

// Mock Supabase
jest.mock('../supabase-config', () => ({
  supabase: {
    from: jest.fn((tableName) => ({
      select: jest.fn((columns) => {
        if (columns === 'count') {
          return {
            limit: jest.fn(() => Promise.resolve({ error: null, data: [{ count: 1 }] }))
          };
        }
        if (columns === '*') {
          return {
            limit: jest.fn(() => Promise.resolve({ error: null, data: [] })),
            eq: jest.fn(() => Promise.resolve({ error: null, data: [] })),
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ error: null, data: [] }))
            })),
            head: jest.fn(() => Promise.resolve({ error: null, count: 0 })),
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ error: null, data: [] }))
            }))
          };
        }
        return {
          limit: jest.fn(() => Promise.resolve({ error: null, data: [] })),
          eq: jest.fn(() => Promise.resolve({ error: null, data: [] })),
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ error: null, data: [] }))
          })),
          head: jest.fn(() => Promise.resolve({ error: null, count: 0 })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ error: null, data: [] }))
          }))
        };
      }),
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ error: null, data: [{ id: '1' }, { id: '2' }] }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ error: null, data: [] }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
        neq: jest.fn(() => Promise.resolve({ error: null, count: 0 }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    },
    storage: {
      listBuckets: jest.fn(() => Promise.resolve({ data: [] }))
    },
    channel: jest.fn(() => ({
      subscribe: jest.fn((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 100);
        return { unsubscribe: jest.fn() };
      })
    })),
    removeChannel: jest.fn()
  },
  isSupabaseConfigured: jest.fn(() => true),
  SUPABASE_TABLES: {
    users: 'users',
    events: 'events',
    tasks: 'tasks',
    setlists: 'setlists',
    gigs: 'gigs',
    brand_deals: 'brand_deals',
    solar_leads: 'solar_leads',
    solar_projects: 'solar_projects',
    pomodoro_sessions: 'pomodoro_sessions',
    appearance_windows: 'appearance_windows',
    pr_events: 'pr_events'
  }
}));

describe('Supabase Setup Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock to return true for isSupabaseConfigured
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  });

  describe('validateDatabaseSetup', () => {
    it('should return valid result when Supabase is configured and tables exist', async () => {
      const result = await validateDatabaseSetup();
      
      expect(result.isValid).toBe(true);
      expect(result.missingTables).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result when Supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await validateDatabaseSetup();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Supabase is not configured. Please check your environment variables.');
    });
  });

  describe('testDatabaseOperations', () => {
    it('should test basic database operations successfully', async () => {
      const result = await testDatabaseOperations();
      
      expect(result.success).toBe(true);
      expect(result.results.select_users).toBe(true);
      expect(result.results.select_events).toBe(true);
      expect(result.results.select_tasks).toBe(true);
    });

    it('should fail when Supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await testDatabaseOperations();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Supabase not configured');
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      const result = await getDatabaseStats();
      
      expect(result.tables).toBeDefined();
      expect(result.totalRecords).toBe(0);
      expect(result.syncStatus).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should handle errors when Supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await getDatabaseStats();
      
      expect(result.errors).toContain('Supabase not configured');
    });
  });

  describe('initializeDefaultData', () => {
    it('should initialize default data successfully', async () => {
      const result = await initializeDefaultData();
      
      expect(result.success).toBe(true);
      expect(result.created).toBeDefined();
    });

    it('should fail when Supabase is not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await initializeDefaultData();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Supabase not configured');
    });
  });

  describe('checkSupabaseHealth', () => {
    it('should check all Supabase services', async () => {
      const result = await checkSupabaseHealth();
      
      expect(result.healthy).toBe(true);
      expect(result.services.database).toBe(true);
      expect(result.services.auth).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it('should report unhealthy when not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await checkSupabaseHealth();
      
      expect(result.healthy).toBe(false);
      expect(result.errors).toContain('Supabase not configured');
    });
  });

  describe('setupSupabaseDatabase', () => {
    it('should perform comprehensive database setup', async () => {
      const result = await setupSupabaseDatabase();
      
      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.health).toBeDefined();
      expect(result.operations).toBeDefined();
    });

    it('should handle setup failures gracefully', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
      
      const result = await setupSupabaseDatabase();
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});