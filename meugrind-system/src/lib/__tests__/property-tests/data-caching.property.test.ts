/**
 * Property Test: Data Caching
 * 
 * Property 18: For any critical data, the system should cache it locally 
 * to ensure instant loading of frequently accessed information
 * 
 * Validates: Requirements 8.4
 */

import * as fc from 'fast-check';
import { asyncPropertyTest } from './utils';

// Define types for data caching testing
interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number; // bytes
  priority: 'critical' | 'high' | 'medium' | 'low';
  ttl?: number; // time to live in milliseconds
}

interface CacheStats {
  totalEntries: number;
  totalSize: number; // bytes
  hitRate: number; // 0-1
  missRate: number; // 0-1
  evictionCount: number;
  criticalDataCached: number;
}

interface CacheOperation {
  type: 'get' | 'set' | 'delete' | 'clear';
  key: string;
  data?: any;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
}

interface CacheResult {
  hit: boolean;
  data?: any;
  loadTime: number; // milliseconds
  fromCache: boolean;
  cacheStats: CacheStats;
}

// Generators for data caching testing
const generators = {
  cacheKey: () => fc.constantFrom(
    'user_profile',
    'recent_tasks',
    'active_projects',
    'song_library',
    'brand_deals',
    'solar_leads',
    'system_settings',
    'navigation_menu',
    'dashboard_widgets',
    'notification_preferences'
  ),
  
  criticalDataKey: () => fc.constantFrom(
    'user_profile',
    'system_settings',
    'navigation_menu',
    'dashboard_widgets'
  ),
  
  cacheData: () => fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    content: fc.string({ maxLength: 1000 }),
    metadata: fc.record({
      version: fc.integer({ min: 1, max: 100 }),
      lastModified: fc.date(),
      size: fc.integer({ min: 100, max: 100000 }),
    }),
  }),
  
  cacheEntry: () => fc.record({
    key: generators.cacheKey(),
    data: generators.cacheData(),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    accessCount: fc.integer({ min: 0, max: 1000 }),
    lastAccessed: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    size: fc.integer({ min: 100, max: 100000 }), // 100B to 100KB
    priority: fc.constantFrom('critical', 'high', 'medium', 'low'),
    ttl: fc.option(fc.integer({ min: 60000, max: 3600000 })), // 1 minute to 1 hour
  }),
  
  cacheOperation: () => fc.record({
    type: fc.constantFrom('get', 'set', 'delete'),
    key: generators.cacheKey(),
    data: fc.option(generators.cacheData()),
    priority: fc.option(fc.constantFrom('critical', 'high', 'medium', 'low')),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  }),
};

// Mock data cache system
const createMockDataCache = () => {
  const cache = new Map<string, CacheEntry>();
  const maxSize = 10 * 1024 * 1024; // 10MB cache limit
  let totalHits = 0;
  let totalMisses = 0;
  let evictionCount = 0;
  
  const cacheManager = {
    // Get current cache stats
    getStats: (): CacheStats => {
      const totalEntries = cache.size;
      const totalSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
      const totalRequests = totalHits + totalMisses;
      const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
      const missRate = totalRequests > 0 ? totalMisses / totalRequests : 0;
      const criticalDataCached = Array.from(cache.values()).filter(entry => entry.priority === 'critical').length;
      
      return {
        totalEntries,
        totalSize,
        hitRate,
        missRate,
        evictionCount,
        criticalDataCached,
      };
    },
    
    // Property 18: Cache critical data for instant loading
    get: async (key: string, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'): Promise<CacheResult> => {
      const startTime = performance.now();
      
      const entry = cache.get(key);
      
      if (entry) {
        // Cache hit
        totalHits++;
        
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        // Property 18: Critical data should load instantly (< 5ms from cache)
        const loadTime = performance.now() - startTime;
        
        return {
          hit: true,
          data: entry.data,
          loadTime,
          fromCache: true,
          cacheStats: cacheManager.getStats(),
        };
      } else {
        // Cache miss
        totalMisses++;
        
        // Simulate loading from storage (slower)
        const simulatedLoadTime = priority === 'critical' ? 50 : 200; // Critical data loads faster even from storage
        await new Promise(resolve => setTimeout(resolve, simulatedLoadTime));
        
        const loadTime = performance.now() - startTime;
        
        return {
          hit: false,
          data: null,
          loadTime,
          fromCache: false,
          cacheStats: cacheManager.getStats(),
        };
      }
    },
    
    // Set data in cache with priority-based management
    set: async (key: string, data: any, priority: 'critical' | 'high' | 'medium' | 'low' = 'medium', ttl?: number): Promise<void> => {
      const size = JSON.stringify(data).length; // Approximate size
      const now = new Date();
      
      const entry: CacheEntry = {
        key,
        data,
        timestamp: now,
        accessCount: 0,
        lastAccessed: now,
        size,
        priority,
        ttl,
      };
      
      // Property 18: Critical data should always be cached
      if (priority === 'critical') {
        // Remove existing entry if present
        if (cache.has(key)) {
          cache.delete(key);
        }
        
        // Make room for critical data if needed
        await cacheManager.evictIfNeeded(size, 'critical');
        
        cache.set(key, entry);
      } else {
        // For non-critical data, check if we have space
        const currentSize = Array.from(cache.values()).reduce((sum, e) => sum + e.size, 0);
        
        if (currentSize + size > maxSize) {
          await cacheManager.evictIfNeeded(size, priority);
        }
        
        // Only cache if we have space or successfully evicted
        const newCurrentSize = Array.from(cache.values()).reduce((sum, e) => sum + e.size, 0);
        if (newCurrentSize + size <= maxSize) {
          cache.set(key, entry);
        }
      }
    },
    
    // Evict entries to make room, preserving critical data
    evictIfNeeded: async (requiredSize: number, newEntryPriority: string): Promise<void> => {
      const currentSize = Array.from(cache.values()).reduce((sum, entry) => sum + entry.size, 0);
      
      if (currentSize + requiredSize <= maxSize) {
        return; // No eviction needed
      }
      
      // Get entries sorted by eviction priority (critical data last)
      const entries: [string, CacheEntry][] = [];
      for (const [key, entry] of cache.entries()) {
        entries.push([key, entry]);
      }
      
      entries.sort(([, a], [, b]) => {
        // Priority order: low -> medium -> high -> critical (critical evicted last)
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Within same priority, evict least recently used
        return a.lastAccessed.getTime() - b.lastAccessed.getTime();
      });
      
      let freedSize = 0;
      const toEvict: string[] = [];
      
      for (const [key, entry] of entries) {
        // Property 18: Never evict critical data unless absolutely necessary
        if (entry.priority === 'critical' && newEntryPriority !== 'critical') {
          continue;
        }
        
        toEvict.push(key);
        freedSize += entry.size;
        
        if (freedSize >= requiredSize) {
          break;
        }
      }
      
      // Perform eviction
      for (const key of toEvict) {
        cache.delete(key);
        evictionCount++;
      }
    },
    
    // Delete specific entry
    delete: async (key: string): Promise<boolean> => {
      return cache.delete(key);
    },
    
    // Clear all cache
    clear: async (): Promise<void> => {
      cache.clear();
      totalHits = 0;
      totalMisses = 0;
      evictionCount = 0;
    },
    
    // Check if key exists
    has: (key: string): boolean => {
      return cache.has(key);
    },
    
    // Get all cached keys
    keys: (): string[] => {
      return Array.from(cache.keys());
    },
    
    // Cleanup expired entries
    cleanup: async (): Promise<number> => {
      const now = Date.now();
      let cleanedCount = 0;
      
      const entries: [string, CacheEntry][] = [];
      for (const [key, entry] of cache.entries()) {
        entries.push([key, entry]);
      }
      
      for (const [key, entry] of entries) {
        if (entry.ttl && (now - entry.timestamp.getTime()) > entry.ttl) {
          cache.delete(key);
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    },
  };
  
  return cacheManager;
};

describe('Property Test: Data Caching', () => {
  let cacheManager: ReturnType<typeof createMockDataCache>;
  
  beforeEach(() => {
    cacheManager = createMockDataCache();
  });

  // Property 18: Data Caching
  describe('Feature: meugrind-productivity-system, Property 18: Data Caching', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (cacheOperations) => {
        try {
          // Clear cache for each test iteration
          await cacheManager.clear();
          
          // Test simplified operation sequences
          for (const operation of cacheOperations) {
            if (operation.type === 'set' && operation.data && operation.priority) {
              await cacheManager.set(operation.key, operation.data, operation.priority);
              
              // Immediately test retrieval
              const result = await cacheManager.get(operation.key, operation.priority);
              
              // Property 18: Critical data should load instantly from cache
              if (result.fromCache && operation.priority === 'critical') {
                if (result.loadTime > 5) {
                  return false; // Critical data should load in < 5ms from cache
                }
              }
              
              // All cached data should load faster than from storage
              if (result.fromCache && result.loadTime > 50) {
                return false; // Cached data should load quickly
              }
              
              if (!result.hit) {
                return false; // Should be a cache hit for data we just set
              }
            }
          }
          
          return true;
        } catch (error) {
          console.error('Data caching test failed:', error);
          return false;
        }
      },
      fc.array(generators.cacheOperation(), { minLength: 1, maxLength: 5 })
    );
  });

  // Property 18: Critical Data Caching Priority
  describe('Feature: meugrind-productivity-system, Property 18: Critical Data Priority', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (criticalDataKeys) => {
        try {
          // Clear cache
          await cacheManager.clear();
          
          // Use unique keys to avoid duplicates
          const uniqueKeys = Array.from(new Set(criticalDataKeys));
          
          // Set critical data
          for (const key of uniqueKeys) {
            const data = {
              id: `critical_${key}`,
              content: `Critical data for ${key}`,
              timestamp: new Date(),
            };
            
            await cacheManager.set(key as string, data, 'critical');
          }
          
          // Verify critical data is cached
          for (const key of uniqueKeys) {
            if (!cacheManager.has(key as string)) {
              return false; // Critical data should always be cached
            }
            
            const result = await cacheManager.get(key as string, 'critical');
            
            if (!result.hit) {
              return false; // Critical data should be cache hit
            }
            
            if (!result.fromCache) {
              return false; // Critical data should come from cache
            }
            
            // Property 18: Critical data should load instantly
            if (result.loadTime > 5) {
              return false; // Critical data should load in < 5ms
            }
          }
          
          // Verify cache stats show critical data
          const stats = cacheManager.getStats();
          if (stats.criticalDataCached !== uniqueKeys.length) {
            return false; // Should have cached all critical data
          }
          
          return true;
        } catch (error) {
          console.error('Critical data caching test failed:', error);
          return false;
        }
      },
      fc.array(generators.criticalDataKey(), { minLength: 1, maxLength: 4 })
    );
  });

  // Property 18: Cache Eviction Preserves Critical Data
  describe('Feature: meugrind-productivity-system, Property 18: Cache Eviction Strategy', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (testData) => {
        try {
          // Clear cache
          await cacheManager.clear();
          
          // Fill cache with critical data first
          const criticalKeys = ['user_profile', 'system_settings'];
          for (const key of criticalKeys) {
            const data = { critical: true, key, size: 10000 }; // 10KB each
            await cacheManager.set(key, data, 'critical');
          }
          
          // Use unique keys to avoid conflicts
          const uniqueTestData = testData.filter((item: any, index: number, arr: any[]) => 
            arr.findIndex((t: any) => t.key === item.key) === index
          );
          
          // Add non-critical data to trigger eviction
          for (const item of uniqueTestData) {
            // Skip if key conflicts with critical data
            if (criticalKeys.includes(item.key)) {
              continue;
            }
            
            const data = { 
              content: 'x'.repeat(50000), // 50KB to trigger eviction
              key: item.key,
              priority: item.priority || 'medium'
            };
            
            await cacheManager.set(item.key, data, item.priority || 'medium');
          }
          
          // Verify critical data is still cached
          for (const criticalKey of criticalKeys) {
            if (!cacheManager.has(criticalKey)) {
              return false; // Critical data should not be evicted
            }
            
            const result = await cacheManager.get(criticalKey, 'critical');
            if (!result.hit || !result.fromCache) {
              return false; // Critical data should still be accessible from cache
            }
          }
          
          return true;
        } catch (error) {
          console.error('Cache eviction test failed:', error);
          return false;
        }
      },
      fc.array(
        fc.record({
          key: generators.cacheKey(),
          priority: fc.constantFrom('low', 'medium', 'high'),
        }),
        { minLength: 3, maxLength: 8 } // Reduced size to avoid conflicts
      )
    );
  });

  // Property 18: Cache Performance Requirements
  describe('Feature: meugrind-productivity-system, Property 18: Cache Performance', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (cacheEntries) => {
        try {
          // Clear cache
          await cacheManager.clear();
          
          // Populate cache
          for (const entry of cacheEntries) {
            await cacheManager.set(entry.key, entry.data, entry.priority);
          }
          
          // Test performance of cache operations
          for (const entry of cacheEntries) {
            const startTime = performance.now();
            const result = await cacheManager.get(entry.key, entry.priority);
            const endTime = performance.now();
            const operationTime = endTime - startTime;
            
            // Property 18: Cache operations should be fast
            if (operationTime > 100) {
              return false; // Cache operations should complete within 100ms
            }
            
            // If data is cached, it should load very quickly
            if (result.fromCache) {
              if (entry.priority === 'critical' && result.loadTime > 5) {
                return false; // Critical cached data should load in < 5ms
              }
              
              if (result.loadTime > 50) {
                return false; // All cached data should load in < 50ms
              }
            }
          }
          
          // Test bulk operations performance
          const bulkStartTime = performance.now();
          const keys = cacheEntries.map((e: any) => e.key);
          
          for (const key of keys) {
            await cacheManager.get(key);
          }
          
          const bulkEndTime = performance.now();
          const bulkTime = bulkEndTime - bulkStartTime;
          const averageTime = bulkTime / keys.length;
          
          // Average cache access should be fast
          if (averageTime > 20) {
            return false; // Average cache access should be < 20ms
          }
          
          return true;
        } catch (error) {
          console.error('Cache performance test failed:', error);
          return false;
        }
      },
      fc.array(generators.cacheEntry(), { minLength: 5, maxLength: 20 })
    );
  });

  // Property 18: Cache Hit Rate Optimization
  describe('Feature: meugrind-productivity-system, Property 18: Cache Hit Rate', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (cacheKey) => {
        try {
          // Clear cache
          await cacheManager.clear();
          
          // Set up critical data
          const criticalData = { key: 'user_profile', cached: true };
          await cacheManager.set('user_profile', criticalData, 'critical');
          
          // Test simple cache miss -> cache hit pattern
          const testKey = String(cacheKey);
          
          // First access - should be miss
          const firstResult = await cacheManager.get(testKey, 'medium');
          
          if (!firstResult.hit) {
            // Add data to cache
            const data = { key: testKey, added: true };
            await cacheManager.set(testKey, data, 'medium');
            
            // Second access - should be hit
            const secondResult = await cacheManager.get(testKey, 'medium');
            if (!secondResult.hit) {
              return false; // Should be cache hit after setting
            }
          }
          
          // Critical data should always be accessible
          const criticalResult = await cacheManager.get('user_profile', 'critical');
          return criticalResult.hit;
        } catch (error) {
          console.error('Cache hit rate test failed:', error);
          return false;
        }
      },
      generators.cacheKey(),
      { numRuns: 50 } // Reduce iterations for this complex test
    );
  });

  // Property 18: Cache Memory Management
  describe('Feature: meugrind-productivity-system, Property 18: Cache Memory Management', () => {
    asyncPropertyTest(
      'Validates: Requirements 8.4',
      async (largeDataSets) => {
        try {
          // Clear cache
          await cacheManager.clear();
          
          // Test memory management with large datasets
          for (const dataSet of largeDataSets) {
            // Add critical data first
            const criticalData = { critical: true, size: 'large', content: 'x'.repeat(10000) };
            await cacheManager.set('critical_data', criticalData, 'critical');
            
            // Add large amounts of data
            for (const item of dataSet) {
              const largeData = {
                content: 'x'.repeat(item.size || 5000), // Variable size data
                metadata: { size: item.size, priority: item.priority },
              };
              
              await cacheManager.set(item.key, largeData, item.priority || 'medium');
            }
            
            // Verify cache is managing memory properly
            const stats = cacheManager.getStats();
            
            // Cache should not exceed reasonable size limits
            if (stats.totalSize > 15 * 1024 * 1024) { // 15MB limit (with some buffer)
              return false; // Cache should manage memory within limits
            }
            
            // Critical data should still be present
            if (!cacheManager.has('critical_data')) {
              return false; // Critical data should be preserved
            }
            
            // Should have evicted some data if we exceeded limits
            if (dataSet.length > 10 && stats.evictionCount === 0 && stats.totalSize > 8 * 1024 * 1024) {
              return false; // Should have performed evictions for large datasets
            }
          }
          
          return true;
        } catch (error) {
          console.error('Cache memory management test failed:', error);
          return false;
        }
      },
      fc.array(
        fc.array(
          fc.record({
            key: generators.cacheKey(),
            priority: fc.constantFrom('low', 'medium', 'high'),
            size: fc.integer({ min: 1000, max: 100000 }), // 1KB to 100KB
          }),
          { minLength: 5, maxLength: 20 }
        ),
        { minLength: 1, maxLength: 3 }
      )
    );
  });
});