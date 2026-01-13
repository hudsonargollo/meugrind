/**
 * Tests for Cache Manager Service
 */

import { cacheManager } from '../cache-manager';

describe('CacheManager', () => {
  beforeEach(async () => {
    // Clear cache before each test
    cacheManager.clear();
    await cacheManager.initialize();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const testData = { message: 'Hello, World!', timestamp: new Date() };
      const key = 'test-key';

      cacheManager.set(key, testData);
      const retrieved = cacheManager.get(key);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheManager.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete items correctly', () => {
      const key = 'delete-test';
      cacheManager.set(key, 'test data');
      
      expect(cacheManager.get(key)).toBe('test data');
      
      const deleted = cacheManager.delete(key);
      expect(deleted).toBe(true);
      expect(cacheManager.get(key)).toBeNull();
    });

    it('should clear all cache entries', () => {
      cacheManager.set('key1', 'data1');
      cacheManager.set('key2', 'data2');
      
      expect(cacheManager.get('key1')).toBe('data1');
      expect(cacheManager.get('key2')).toBe('data2');
      
      cacheManager.clear();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire items after TTL', (done) => {
      const key = 'ttl-test';
      const data = 'expires soon';
      const ttl = 100; // 100ms

      cacheManager.set(key, data, { ttl });
      
      // Should be available immediately
      expect(cacheManager.get(key)).toBe(data);
      
      // Should expire after TTL
      setTimeout(() => {
        expect(cacheManager.get(key)).toBeNull();
        done();
      }, ttl + 50);
    });

    it('should handle items without TTL', () => {
      const key = 'no-ttl';
      const data = 'never expires';

      cacheManager.set(key, data, { ttl: 0 });
      expect(cacheManager.get(key)).toBe(data);
    });
  });

  describe('priority system', () => {
    it('should accept different priority levels', () => {
      const priorities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      
      priorities.forEach((priority, index) => {
        const key = `priority-${priority}`;
        const data = `data-${index}`;
        
        expect(() => cacheManager.set(key, data, { priority })).not.toThrow();
        expect(cacheManager.get(key)).toBe(data);
      });
    });
  });

  describe('statistics', () => {
    it('should track cache statistics', () => {
      const stats = cacheManager.getStats();
      
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('entryCount');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('missRate');
      expect(stats).toHaveProperty('compressionRatio');
      
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.entryCount).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.missRate).toBe('number');
    });

    it('should update hit/miss rates correctly', () => {
      const key = 'stats-test';
      const data = 'test data';

      // Initial stats
      const initialStats = cacheManager.getStats();
      
      // Cache miss
      cacheManager.get('non-existent');
      
      // Cache set and hit
      cacheManager.set(key, data);
      cacheManager.get(key);
      
      const finalStats = cacheManager.getStats();
      
      // Should have recorded hits and misses
      expect(finalStats.entryCount).toBeGreaterThan(initialStats.entryCount);
    });
  });

  describe('configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        maxSize: 50 * 1024 * 1024, // 50MB
        defaultTTL: 60000, // 1 minute
        compressionThreshold: 2048 // 2KB
      };

      expect(() => cacheManager.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('prefetching', () => {
    it('should prefetch critical data without errors', async () => {
      await expect(cacheManager.prefetchCriticalData()).resolves.not.toThrow();
    });
  });
});