// Database core
export { db, MEUGRINDDatabase } from './database';
export * from './database-utils';

// CRUD operations
export * from './crud-operations';

// Sync and offline functionality
export { syncManager, SyncManager } from './sync-manager';
export { supabaseSyncService, SupabaseSyncService } from './supabase-sync-service';
export { supabase, isSupabaseConfigured } from './supabase-config';
export { serviceWorkerManager, ServiceWorkerManager } from './service-worker';
export { connectivityService, ConnectivityService } from './connectivity-service';
export { offlineService, OfflineService } from './offline-service';
export * from './conflict-resolution';

// Power management
export { powerManager } from './power-management';
export type { PowerState, EcoModeSettings, PowerManagementConfig } from './power-management';

// Caching and compression
export { cacheManager } from './cache-manager';
export type { CacheEntry, CacheConfig, CacheStats } from './cache-manager';
export { imageCompression } from './image-compression';
export type { CompressionOptions, CompressionResult } from './image-compression';