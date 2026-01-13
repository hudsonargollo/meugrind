import { db } from './database';
import { User } from '../types';

// Re-export db for testing
export { db };

/**
 * Initialize the database with default data
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('Database opened successfully');
    
    // Check if database is already initialized
    const userCount = await db.users.count();
    if (userCount > 0) {
      console.log('Database already initialized');
      return;
    }

    // Create default users if none exist
    await createDefaultUsers();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Create default users for the system
 */
async function createDefaultUsers(): Promise<void> {
  const defaultUsers: User[] = [
    {
      id: 'manager-user',
      email: 'manager@meugrind.com',
      role: 'manager',
      permissions: [
        { resource: '*', actions: ['read', 'write', 'delete'] }
      ],
      preferences: {
        theme: 'auto',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          push: true,
          focusMode: false
        },
        privacyShield: {
          enabled: false,
          hidePersonalDetails: false,
          showAsBusy: true,
          allowedViewers: []
        }
      }
    },
    {
      id: 'personal-user',
      email: 'personal@meugrind.com',
      role: 'personal',
      permissions: [
        { resource: 'tasks', actions: ['read', 'write'] },
        { resource: 'events', actions: ['read'] },
        { resource: 'pomodoro', actions: ['read', 'write'] },
        { resource: 'study', actions: ['read', 'write'] }
      ],
      preferences: {
        theme: 'auto',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: false,
          push: true,
          focusMode: true
        },
        privacyShield: {
          enabled: true,
          hidePersonalDetails: true,
          showAsBusy: true,
          allowedViewers: ['manager@meugrind.com']
        }
      }
    }
  ];

  await db.users.bulkAdd(defaultUsers);
  console.log('Default users created');
}

/**
 * Clear all data from the database (useful for testing)
 */
export async function clearDatabase(): Promise<void> {
  try {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
    });
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Failed to clear database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  tables: { name: string; count: number }[];
  totalRecords: number;
  syncPending: number;
  conflicts: number;
}> {
  const stats = {
    tables: [] as { name: string; count: number }[],
    totalRecords: 0,
    syncPending: 0,
    conflicts: 0
  };

  for (const table of db.tables) {
    const count = await table.count();
    stats.tables.push({ name: table.name, count });
    stats.totalRecords += count;
  }

  // Count sync-related statistics
  const syncableTables = [
    'events', 'tasks', 'setlists', 'gigs', 'brandDeals', 
    'solarLeads', 'solarProjects', 'pomodoroSessions', 
    'appearanceWindows', 'prEvents'
  ];

  for (const tableName of syncableTables) {
    const table = db[tableName as keyof typeof db] as any;
    const pending = await table.where('syncStatus').equals('pending').count();
    const conflicts = await table.where('syncStatus').equals('conflict').count();
    
    stats.syncPending += pending;
    stats.conflicts += conflicts;
  }

  return stats;
}

/**
 * Export database data for backup
 */
export async function exportDatabase(): Promise<any> {
  const data: any = {};
  
  for (const table of db.tables) {
    data[table.name] = await table.toArray();
  }
  
  return {
    version: db.verno,
    timestamp: new Date().toISOString(),
    data
  };
}

/**
 * Import database data from backup
 */
export async function importDatabase(backup: any): Promise<void> {
  if (!backup.data) {
    throw new Error('Invalid backup format');
  }

  await db.transaction('rw', db.tables, async () => {
    // Clear existing data
    await Promise.all(db.tables.map(table => table.clear()));
    
    // Import data
    for (const [tableName, records] of Object.entries(backup.data)) {
      const table = db[tableName as keyof typeof db] as any;
      if (table && Array.isArray(records)) {
        await table.bulkAdd(records);
      }
    }
  });
  
  console.log('Database imported successfully');
}

/**
 * Check if the database is healthy
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Check if database is accessible
    await db.open();
    
    // Check for orphaned records
    const events = await db.events.toArray();
    const tasks = await db.tasks.toArray();
    
    // Check for data integrity issues
    for (const event of events) {
      if (!event.id || !event.title || !event.startTime) {
        issues.push(`Event ${event.id} has missing required fields`);
      }
    }
    
    for (const task of tasks) {
      if (!task.id || !task.title) {
        issues.push(`Task ${task.id} has missing required fields`);
      }
    }
    
    // Check sync queue health
    const oldSyncItems = await db.syncQueue
      .where('timestamp')
      .below(new Date(Date.now() - 24 * 60 * 60 * 1000)) // 24 hours ago
      .count();
    
    if (oldSyncItems > 100) {
      issues.push(`${oldSyncItems} old sync queue items may indicate sync problems`);
    }
    
  } catch (error) {
    issues.push(`Database access error: ${error}`);
  }
  
  return {
    isHealthy: issues.length === 0,
    issues
  };
}