/**
 * Cache Manager for MEUGRIND System
 * Handles intelligent caching of critical data and resource optimization
 */

import { powerManager } from './power-management';

export interface CacheEntry<T = any> {
  key: string;
  data: T | string; // Allow string for compressed data
  timestamp: Date;
  expiresAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  size: number; // Size in bytes
  accessCount: number;
  lastAccessed: Date;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default time-to-live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionThreshold: number; // Compress items larger than this size
}

export interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    maxSize: 200 * 1024 * 1024, // 200MB default
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    compressionThreshold: 1024 // 1KB
  };
  
  private stats = {
    hits: 0,
    misses: 0,
    totalSize: 0,
    compressionSaves: 0
  };

  private cleanupTimer?: NodeJS.Timeout;
  private initialized = false;

  /**
   * Initialize the cache manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Listen for power management changes
    powerManager.subscribe((powerState) => {
      const optimizations = powerManager.getResourceOptimizations();
      this.updateConfig({ maxSize: optimizations.cacheSize });
    });

    // Start cleanup timer
    this.startCleanupTimer();
    
    // Load cached data from IndexedDB if available
    await this.loadPersistedCache();
    
    this.initialized = true;
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    this.stats.hits++;

    // Decompress if needed
    return this.decompressData(entry.data);
  }

  /**
   * Set item in cache
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      persist?: boolean;
    } = {}
  ): void {
    const {
      ttl = this.config.defaultTTL,
      priority = 'medium',
      persist = false
    } = options;

    // Calculate size
    const serializedData = JSON.stringify(data);
    const size = new Blob([serializedData]).size;

    // Compress if above threshold
    const finalData = size > this.config.compressionThreshold ? 
      this.compressData(data) : data;

    const entry: CacheEntry<T> = {
      key,
      data: finalData,
      timestamp: new Date(),
      expiresAt: ttl > 0 ? new Date(Date.now() + ttl) : undefined,
      priority,
      size,
      accessCount: 0,
      lastAccessed: new Date()
    };

    // Check if we need to make space
    if (this.stats.totalSize + size > this.config.maxSize) {
      this.evictItems(size);
    }

    // Add to cache
    this.cache.set(key, entry);
    this.stats.totalSize += size;

    // Persist critical items
    if (persist || priority === 'critical') {
      this.persistItem(key, entry);
    }
  }

  /**
   * Remove item from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      return true;
    }
    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      totalSize: this.stats.totalSize,
      entryCount: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      compressionRatio: this.stats.compressionSaves > 0 ? 
        this.stats.compressionSaves / this.stats.totalSize : 0
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If max size decreased, trigger cleanup
    if (newConfig.maxSize && this.stats.totalSize > newConfig.maxSize) {
      this.evictItems(this.stats.totalSize - newConfig.maxSize);
    }
  }

  /**
   * Prefetch critical data
   */
  async prefetchCriticalData(): Promise<void> {
    const criticalKeys = [
      'user-preferences',
      'recent-events',
      'active-projects',
      'sync-status'
    ];

    // This would normally fetch from database or API
    // For now, we'll simulate prefetching
    for (const key of criticalKeys) {
      if (!this.cache.has(key)) {
        // Simulate fetching critical data
        const mockData = { key, timestamp: new Date() };
        this.set(key, mockData, { priority: 'critical', persist: true });
      }
    }
  }

  /**
   * Compress data using simple JSON compression
   */
  private compressData<T>(data: T): string {
    try {
      const jsonString = JSON.stringify(data);
      
      // Simple compression: remove whitespace and use shorter keys
      const compressed = jsonString
        .replace(/\s+/g, '')
        .replace(/"timestamp"/g, '"ts"')
        .replace(/"createdAt"/g, '"ca"')
        .replace(/"updatedAt"/g, '"ua"')
        .replace(/"syncStatus"/g, '"ss"');

      const originalSize = new Blob([jsonString]).size;
      const compressedSize = new Blob([compressed]).size;
      
      if (compressedSize < originalSize) {
        this.stats.compressionSaves += (originalSize - compressedSize);
        return `__COMPRESSED__${compressed}`;
      }
      
      return jsonString;
    } catch (error) {
      console.warn('Compression failed:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data
   */
  private decompressData<T>(data: any): T {
    if (typeof data === 'string' && data.startsWith('__COMPRESSED__')) {
      try {
        const compressed = data.substring('__COMPRESSED__'.length);
        
        // Reverse compression
        const decompressed = compressed
          .replace(/"ts"/g, '"timestamp"')
          .replace(/"ca"/g, '"createdAt"')
          .replace(/"ua"/g, '"updatedAt"')
          .replace(/"ss"/g, '"syncStatus"');

        return JSON.parse(decompressed);
      } catch (error) {
        console.warn('Decompression failed:', error);
        return data as T;
      }
    }
    
    return data as T;
  }

  /**
   * Evict items to make space
   */
  private evictItems(spaceNeeded: number): void {
    // Sort by priority and access patterns (LRU with priority)
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;
      
      // Never evict critical items
      if (entryA.priority === 'critical') return 1;
      if (entryB.priority === 'critical') return -1;
      
      // Priority order: low < medium < high
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const priorityDiff = priorityOrder[entryA.priority] - priorityOrder[entryB.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by last accessed (LRU)
      return entryA.lastAccessed.getTime() - entryB.lastAccessed.getTime();
    });

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= spaceNeeded) break;
      
      this.cache.delete(key);
      freedSpace += entry.size;
      this.stats.totalSize -= entry.size;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = new Date();
    const toDelete: string[] = [];

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        toDelete.push(key);
      }
    });

    for (const key of toDelete) {
      this.delete(key);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Persist item to IndexedDB for critical data
   */
  private async persistItem(key: string, entry: CacheEntry): Promise<void> {
    try {
      // This would normally use IndexedDB
      // For now, we'll use localStorage as a fallback
      if (typeof localStorage !== 'undefined') {
        const persistKey = `meugrind_cache_${key}`;
        localStorage.setItem(persistKey, JSON.stringify(entry));
      }
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  /**
   * Load persisted cache from storage
   */
  private async loadPersistedCache(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return;

      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('meugrind_cache_')
      );

      for (const persistKey of keys) {
        try {
          const entry = JSON.parse(localStorage.getItem(persistKey) || '');
          const cacheKey = persistKey.replace('meugrind_cache_', '');
          
          // Check if still valid
          if (!entry.expiresAt || new Date(entry.expiresAt) > new Date()) {
            this.cache.set(cacheKey, {
              ...entry,
              timestamp: new Date(entry.timestamp),
              expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined,
              lastAccessed: new Date(entry.lastAccessed)
            });
            this.stats.totalSize += entry.size;
          } else {
            // Remove expired persisted item
            localStorage.removeItem(persistKey);
          }
        } catch (error) {
          console.warn(`Failed to load persisted cache item ${persistKey}:`, error);
          localStorage.removeItem(persistKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
    this.initialized = false;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Initialize on module load if in browser environment
if (typeof window !== 'undefined') {
  cacheManager.initialize().catch(console.error);
}

export default cacheManager;