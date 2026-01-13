/**
 * Supabase Database Setup and Validation Utilities
 * 
 * This module provides utilities to validate and set up the Supabase database
 * for the MEUGRIND productivity system.
 */

import { supabase, isSupabaseConfigured, SUPABASE_TABLES } from './supabase-config';

export interface DatabaseValidationResult {
  isValid: boolean;
  missingTables: string[];
  missingIndexes: string[];
  rlsStatus: { [table: string]: boolean };
  errors: string[];
  warnings: string[];
}

export interface DatabaseSetupResult {
  success: boolean;
  tablesCreated: number;
  indexesCreated: number;
  rlsPoliciesCreated: number;
  errors: string[];
}

/**
 * Validate the Supabase database setup
 */
export async function validateDatabaseSetup(): Promise<DatabaseValidationResult> {
  const result: DatabaseValidationResult = {
    isValid: true,
    missingTables: [],
    missingIndexes: [],
    rlsStatus: {},
    errors: [],
    warnings: []
  };

  if (!isSupabaseConfigured()) {
    result.isValid = false;
    result.errors.push('Supabase is not configured. Please check your environment variables.');
    return result;
  }

  try {
    // Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (connectionError) {
      result.isValid = false;
      result.errors.push(`Connection failed: ${connectionError.message}`);
      return result;
    }

    // Validate required tables exist
    const requiredTables = Object.values(SUPABASE_TABLES);
    for (const tableName of requiredTables) {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          result.missingTables.push(tableName);
          result.isValid = false;
        } else {
          result.warnings.push(`Table ${tableName}: ${error.message}`);
        }
      }
    }

    // Check RLS status for critical tables
    const criticalTables = ['users', 'events', 'tasks', 'brand_deals', 'solar_leads'];
    for (const tableName of criticalTables) {
      try {
        // Try to query the table - if RLS is properly configured, this should work
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);

        result.rlsStatus[tableName] = !error || !error.message.includes('RLS');
      } catch (error) {
        result.rlsStatus[tableName] = false;
        result.warnings.push(`RLS check failed for ${tableName}: ${error}`);
      }
    }

    // Validate essential indexes exist (this would require admin access in a real scenario)
    const essentialIndexes = [
      'idx_events_start_time',
      'idx_tasks_due_date',
      'idx_brand_deals_status',
      'idx_solar_leads_status'
    ];

    // Note: In a production environment, you'd need admin access to check indexes
    // For now, we'll assume they exist if the schema was applied correctly
    result.warnings.push('Index validation requires admin access - assuming indexes exist if schema was applied');

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Database validation failed: ${error}`);
  }

  return result;
}

/**
 * Test database operations to ensure everything works correctly
 */
export async function testDatabaseOperations(): Promise<{
  success: boolean;
  results: { [operation: string]: boolean };
  errors: string[];
}> {
  const testResults = {
    success: true,
    results: {} as { [operation: string]: boolean },
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    testResults.success = false;
    testResults.errors.push('Supabase not configured');
    return testResults;
  }

  // Test basic CRUD operations on a test table (users)
  const testOperations = [
    {
      name: 'select_users',
      operation: async () => {
        const { error } = await supabase.from('users').select('id').limit(1);
        return !error;
      }
    },
    {
      name: 'select_events',
      operation: async () => {
        const { error } = await supabase.from('events').select('id').limit(1);
        return !error;
      }
    },
    {
      name: 'select_tasks',
      operation: async () => {
        const { error } = await supabase.from('tasks').select('id').limit(1);
        return !error;
      }
    },
    {
      name: 'realtime_connection',
      operation: async () => {
        try {
          // Test realtime connection
          const channel = supabase.channel('test-channel');
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
            channel.subscribe((status) => {
              clearTimeout(timeout);
              resolve(status === 'SUBSCRIBED');
            });
          });
          supabase.removeChannel(channel);
          return true;
        } catch {
          return false;
        }
      }
    }
  ];

  for (const test of testOperations) {
    try {
      testResults.results[test.name] = await test.operation();
      if (!testResults.results[test.name]) {
        testResults.success = false;
      }
    } catch (error) {
      testResults.results[test.name] = false;
      testResults.success = false;
      testResults.errors.push(`${test.name}: ${error}`);
    }
  }

  return testResults;
}

/**
 * Get database statistics and health information
 */
export async function getDatabaseStats(): Promise<{
  tables: { [tableName: string]: number };
  totalRecords: number;
  syncStatus: { [status: string]: number };
  lastActivity?: Date;
  errors: string[];
}> {
  const stats = {
    tables: {} as { [tableName: string]: number },
    totalRecords: 0,
    syncStatus: { synced: 0, pending: 0, conflict: 0 } as { [status: string]: number },
    lastActivity: undefined as Date | undefined,
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    stats.errors.push('Supabase not configured');
    return stats;
  }

  try {
    // Get record counts for each table
    const syncableTables = [
      'events', 'tasks', 'setlists', 'gigs', 'brand_deals',
      'solar_leads', 'solar_projects', 'pomodoro_sessions',
      'appearance_windows', 'pr_events'
    ];

    for (const tableName of syncableTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          stats.errors.push(`Failed to count ${tableName}: ${error.message}`);
        } else {
          stats.tables[tableName] = count || 0;
          stats.totalRecords += count || 0;
        }
      } catch (error) {
        stats.errors.push(`Error counting ${tableName}: ${error}`);
      }
    }

    // Get sync status distribution (for tables that have sync_status)
    const tablesWithSyncStatus = ['events', 'tasks', 'brand_deals', 'solar_leads', 'pomodoro_sessions'];
    
    for (const tableName of tablesWithSyncStatus) {
      try {
        // Count synced records
        const { count: syncedCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('sync_status', 'synced');

        // Count pending records
        const { count: pendingCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('sync_status', 'pending');

        // Count conflict records
        const { count: conflictCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('sync_status', 'conflict');

        stats.syncStatus.synced += syncedCount || 0;
        stats.syncStatus.pending += pendingCount || 0;
        stats.syncStatus.conflict += conflictCount || 0;
      } catch (error) {
        // Table might not have sync_status column, which is fine
      }
    }

    // Get last activity (most recent updated_at across all tables)
    for (const tableName of syncableTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const lastUpdate = new Date(data[0].updated_at);
          if (!stats.lastActivity || lastUpdate > stats.lastActivity) {
            stats.lastActivity = lastUpdate;
          }
        }
      } catch (error) {
        // Ignore errors for individual tables
      }
    }

  } catch (error) {
    stats.errors.push(`Failed to get database stats: ${error}`);
  }

  return stats;
}

/**
 * Initialize default data if the database is empty
 */
export async function initializeDefaultData(): Promise<{
  success: boolean;
  created: { [entityType: string]: number };
  errors: string[];
}> {
  const result = {
    success: true,
    created: {} as { [entityType: string]: number },
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    result.success = false;
    result.errors.push('Supabase not configured');
    return result;
  }

  try {
    // Check if we already have data
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userCount && userCount > 0) {
      result.errors.push('Database already contains data - skipping initialization');
      return result;
    }

    // Create default user roles
    const defaultUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'manager@meugrind.local',
        role: 'manager',
        permissions: ['read', 'write', 'admin'],
        preferences: {
          theme: 'dark',
          notifications: true,
          autoSync: true
        }
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'personal@meugrind.local',
        role: 'personal',
        permissions: ['read', 'write'],
        preferences: {
          theme: 'light',
          notifications: true,
          autoSync: true,
          privacyShield: true
        }
      }
    ];

    const { data: createdUsers, error: userError } = await supabase
      .from('users')
      .insert(defaultUsers)
      .select();

    if (userError) {
      result.errors.push(`Failed to create default users: ${userError.message}`);
      result.success = false;
    } else {
      result.created.users = createdUsers?.length || 0;
    }

    // Create some sample talking points for PR management
    const defaultTalkingPoints = [
      {
        category: 'personal_brand',
        topic: 'Music Career Journey',
        content: 'Started as a bedroom producer, evolved into live performance, focusing on authentic connection with audience',
        approved: true
      },
      {
        category: 'business',
        topic: 'Entrepreneurship',
        content: 'Building multiple revenue streams through music, content creation, and strategic partnerships',
        approved: true
      },
      {
        category: 'lifestyle',
        topic: 'Work-Life Balance',
        content: 'Using productivity systems and time management to balance creative work with business responsibilities',
        approved: true
      }
    ];

    const { data: createdTalkingPoints, error: talkingPointsError } = await supabase
      .from('talking_points')
      .insert(defaultTalkingPoints)
      .select();

    if (talkingPointsError) {
      result.errors.push(`Failed to create talking points: ${talkingPointsError.message}`);
    } else {
      result.created.talking_points = createdTalkingPoints?.length || 0;
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Initialization failed: ${error}`);
  }

  return result;
}

/**
 * Clean up test data and reset database to initial state
 */
export async function resetDatabase(): Promise<{
  success: boolean;
  deleted: { [tableName: string]: number };
  errors: string[];
}> {
  const result = {
    success: true,
    deleted: {} as { [tableName: string]: number },
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    result.success = false;
    result.errors.push('Supabase not configured');
    return result;
  }

  // WARNING: This is a destructive operation
  console.warn('DESTRUCTIVE OPERATION: Resetting database to initial state');

  try {
    // Delete data from all tables (in reverse dependency order)
    const tablesToReset = [
      'media_coverage',
      'approved_narratives', 
      'talking_points',
      'pr_events',
      'appearance_windows',
      'pr_contracts',
      'study_trackers',
      'pomodoro_stats',
      'pomodoro_sessions',
      'followup_tasks',
      'solar_projects',
      'solar_leads',
      'scripts',
      'content_assets',
      'brand_deals',
      'brands',
      'call_sheets',
      'tech_riders',
      'setlists',
      'gigs',
      'contractors',
      'songs',
      'tasks',
      'events',
      'users'
    ];

    for (const tableName of tablesToReset) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) {
          result.errors.push(`Failed to reset ${tableName}: ${error.message}`);
        } else {
          result.deleted[tableName] = count || 0;
        }
      } catch (error) {
        result.errors.push(`Error resetting ${tableName}: ${error}`);
      }
    }

    // Reinitialize with default data
    const initResult = await initializeDefaultData();
    if (!initResult.success) {
      result.errors.push(...initResult.errors);
      result.success = false;
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Database reset failed: ${error}`);
  }

  return result;
}

/**
 * Export database schema and data for backup
 */
export async function exportDatabaseData(): Promise<{
  success: boolean;
  data: { [tableName: string]: any[] };
  metadata: {
    exportDate: Date;
    totalRecords: number;
    tables: string[];
  };
  errors: string[];
}> {
  const result = {
    success: true,
    data: {} as { [tableName: string]: any[] },
    metadata: {
      exportDate: new Date(),
      totalRecords: 0,
      tables: [] as string[]
    },
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    result.success = false;
    result.errors.push('Supabase not configured');
    return result;
  }

  try {
    const tablesToExport = Object.values(SUPABASE_TABLES);

    for (const tableName of tablesToExport) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          result.errors.push(`Failed to export ${tableName}: ${error.message}`);
        } else {
          result.data[tableName] = data || [];
          result.metadata.totalRecords += data?.length || 0;
          result.metadata.tables.push(tableName);
        }
      } catch (error) {
        result.errors.push(`Error exporting ${tableName}: ${error}`);
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Database export failed: ${error}`);
  }

  return result;
}

/**
 * Check Supabase service health and configuration
 */
export async function checkSupabaseHealth(): Promise<{
  healthy: boolean;
  services: {
    database: boolean;
    auth: boolean;
    realtime: boolean;
    storage: boolean;
  };
  latency: number;
  errors: string[];
}> {
  const result = {
    healthy: true,
    services: {
      database: false,
      auth: false,
      realtime: false,
      storage: false
    },
    latency: 0,
    errors: [] as string[]
  };

  if (!isSupabaseConfigured()) {
    result.healthy = false;
    result.errors.push('Supabase not configured');
    return result;
  }

  const startTime = Date.now();

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    result.services.database = !dbError;
    if (dbError) {
      result.errors.push(`Database: ${dbError.message}`);
    }

    // Test auth service
    try {
      const { data: { session } } = await supabase.auth.getSession();
      result.services.auth = true; // If we can call auth methods, service is available
    } catch (error) {
      result.services.auth = false;
      result.errors.push(`Auth: ${error}`);
    }

    // Test realtime connection
    try {
      const channel = supabase.channel('health-check');
      const realtimePromise = new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        channel.subscribe((status) => {
          clearTimeout(timeout);
          resolve(status === 'SUBSCRIBED');
        });
      });
      
      result.services.realtime = await realtimePromise as boolean;
      supabase.removeChannel(channel);
    } catch (error) {
      result.services.realtime = false;
      result.errors.push(`Realtime: ${error}`);
    }

    // Test storage (if available)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      result.services.storage = true;
    } catch (error) {
      result.services.storage = false;
      result.errors.push(`Storage: ${error}`);
    }

    result.latency = Date.now() - startTime;
    result.healthy = result.services.database && result.services.auth;

  } catch (error) {
    result.healthy = false;
    result.errors.push(`Health check failed: ${error}`);
  }

  return result;
}

/**
 * Comprehensive setup validation and initialization
 */
export async function setupSupabaseDatabase(): Promise<{
  success: boolean;
  validation: DatabaseValidationResult;
  operations: DatabaseSetupResult;
  health: {
    healthy: boolean;
    services: {
      database: boolean;
      auth: boolean;
      realtime: boolean;
      storage: boolean;
    };
    latency: number;
    errors: string[];
  };
  errors: string[];
}> {
  const setupResult = {
    success: true,
    validation: {} as DatabaseValidationResult,
    operations: {} as DatabaseSetupResult,
    health: {
      healthy: false,
      services: { database: false, auth: false, realtime: false, storage: false },
      latency: 0,
      errors: [] as string[]
    },
    errors: [] as string[]
  };

  console.log('Starting comprehensive Supabase database setup...');

  try {
    // Step 1: Validate current database setup
    console.log('Step 1: Validating database setup...');
    setupResult.validation = await validateDatabaseSetup();
    
    if (!setupResult.validation.isValid) {
      setupResult.errors.push('Database validation failed');
      setupResult.errors.push(...setupResult.validation.errors);
    }

    // Step 2: Check service health
    console.log('Step 2: Checking Supabase service health...');
    setupResult.health = await checkSupabaseHealth();
    
    if (!setupResult.health.healthy) {
      setupResult.errors.push('Supabase health check failed');
      setupResult.errors.push(...setupResult.health.errors);
    }

    // Step 3: Test database operations
    console.log('Step 3: Testing database operations...');
    const operationTest = await testDatabaseOperations();
    
    if (!operationTest.success) {
      setupResult.errors.push('Database operation tests failed');
      setupResult.errors.push(...operationTest.errors);
    }

    // Step 4: Initialize default data if needed
    console.log('Step 4: Initializing default data...');
    const initResult = await initializeDefaultData();
    setupResult.operations = {
      success: initResult.success,
      tablesCreated: 0,
      indexesCreated: 0,
      rlsPoliciesCreated: 0,
      errors: initResult.errors
    };

    if (!initResult.success) {
      setupResult.errors.push('Default data initialization failed');
      setupResult.errors.push(...initResult.errors);
    }

    // Determine overall success
    setupResult.success = setupResult.validation.isValid && 
                         setupResult.health.healthy && 
                         operationTest.success;

    if (setupResult.success) {
      console.log('✅ Supabase database setup completed successfully');
    } else {
      console.log('❌ Supabase database setup completed with errors');
    }

  } catch (error) {
    setupResult.success = false;
    setupResult.errors.push(`Setup process failed: ${error}`);
    console.error('Supabase setup failed:', error);
  }

  return setupResult;
}