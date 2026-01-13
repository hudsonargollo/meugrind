import { initializeDatabase, clearDatabase } from './database-utils';
import { taskCRUD, eventCRUD } from './crud-operations';
import { syncManager } from './sync-manager';
import { offlineService } from './offline-service';

/**
 * Demonstration of offline-first functionality
 */
export async function demonstrateOfflineFunctionality() {
  console.log('🚀 Starting MEUGRIND Offline-First Demo');
  
  try {
    // Initialize the database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Create some sample data
    const sampleTask = await taskCRUD.createSyncable({
      title: 'Complete offline-first implementation',
      description: 'Implement IndexedDB with Dexie.js and sync functionality',
      completed: false,
      priority: 'high',
      category: 'development'
    });
    console.log('✅ Sample task created:', (sampleTask as any).title);

    const sampleEvent = await eventCRUD.createSyncable({
      title: 'Band Practice',
      description: 'Weekly reggae band practice session',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      type: 'gig',
      visibility: 'manager_only',
      createdBy: 'demo-user'
    });
    console.log('✅ Sample event created:', (sampleEvent as any).title);

    // Demonstrate CRUD operations
    await taskCRUD.updateSyncable(sampleTask.id, { completed: true } as any);
    console.log('✅ Task marked as completed');

    const allTasks = await taskCRUD.getAll();
    console.log(`✅ Retrieved ${allTasks.length} tasks from local storage`);

    // Demonstrate sync functionality
    const syncStatus = await syncManager.getSyncStatus();
    console.log('✅ Sync status:', {
      isOnline: syncStatus.isOnline,
      pendingOperations: syncStatus.pendingOperations,
      conflicts: syncStatus.conflicts
    });

    // Demonstrate offline service capabilities
    const capabilities = offlineService.getOfflineCapabilities();
    console.log('✅ Offline capabilities:', capabilities);

    console.log('🎉 Demo completed successfully!');
    
    return {
      success: true,
      tasksCreated: allTasks.length,
      syncStatus,
      capabilities
    };

  } catch (error) {
    console.error('❌ Demo failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up demo data
 */
export async function cleanupDemo() {
  try {
    await clearDatabase();
    console.log('✅ Demo data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}