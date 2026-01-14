import { performanceMonitor } from './performance-monitor';
import { cacheManager } from './cache-manager';
import { powerManager } from './power-management';

interface OptimizationConfig {
  enableCaching: boolean;
  enableBatching: boolean;
  enableLazyLoading: boolean;
  enableImageCompression: boolean;
  maxCacheSize: number;
  batchSize: number;
  debounceMs: number;
}

class PerformanceOptimizer {
  private config: OptimizationConfig = {
    enableCaching: true,
    enableBatching: true,
    enableLazyLoading: true,
    enableImageCompression: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    batchSize: 10,
    debounceMs: 300,
  };

  private batchQueue: Map<string, any[]> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Optimize database operations with batching
  async batchOperation<T>(
    operationType: string,
    operation: () => Promise<T>,
    batchKey?: string
  ): Promise<T> {
    if (!this.config.enableBatching) {
      return operation();
    }

    const key = batchKey || operationType;
    
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueue.has(key)) {
        this.batchQueue.set(key, []);
      }
      
      this.batchQueue.get(key)!.push({ operation, resolve, reject });
      
      // Clear existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }
      
      // Set new timer to process batch
      const timer = setTimeout(async () => {
        await this.processBatch(key);
      }, this.config.debounceMs);
      
      this.debounceTimers.set(key, timer);
    });
  }

  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batchQueue.get(batchKey);
    if (!batch || batch.length === 0) return;
    
    // Clear the batch
    this.batchQueue.delete(batchKey);
    this.debounceTimers.delete(batchKey);
    
    // Process operations in chunks
    const chunks = this.chunkArray(batch, this.config.batchSize);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async ({ operation, resolve, reject }) => {
          try {
            const result = await operation();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
    }
  }

  // Optimize image loading with compression and lazy loading
  async optimizeImage(
    imageUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      lazy?: boolean;
    } = {}
  ): Promise<string> {
    const cacheKey = `optimized_image_${imageUrl}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached as string;
      }
    }
    
    return performanceMonitor.measure('optimize_image', async () => {
      // If lazy loading is enabled and image is not in viewport, return placeholder
      if (options.lazy && this.config.enableLazyLoading) {
        const isInViewport = await this.isImageInViewport(imageUrl);
        if (!isInViewport) {
          return this.generatePlaceholder(options.width, options.height);
        }
      }
      
      // Compress image if enabled
      if (this.config.enableImageCompression) {
        const compressedUrl = await this.compressImage(imageUrl, options);
        
        // Cache the result
        if (this.config.enableCaching) {
          await cacheManager.set(cacheKey, compressedUrl, { ttl: 3600 }); // 1 hour cache
        }
        
        return compressedUrl;
      }
      
      return imageUrl;
    });
  }

  // Optimize data queries with intelligent caching
  async optimizeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number;
      staleWhileRevalidate?: boolean;
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<T> {
    const { ttl = 300, staleWhileRevalidate = true, priority = 'medium' } = options;
    
    if (!this.config.enableCaching) {
      return queryFn();
    }
    
    return performanceMonitor.measure(`query_${queryKey}`, async () => {
      const cached = await cacheManager.get(queryKey);
      
      if (cached) {
        // If stale-while-revalidate is enabled, return cached data and update in background
        if (staleWhileRevalidate) {
          // Background update (don't await)
          this.backgroundUpdate(queryKey, queryFn, ttl).catch(console.error);
        }
        
        return cached as T;
      }
      
      // No cache hit, execute query
      const result = await queryFn();
      
      // Cache the result
      await cacheManager.set(queryKey, result, { ttl });
      
      return result;
    });
  }

  // Optimize for battery usage
  async optimizeForBattery(): Promise<void> {
    const batteryLevel = await powerManager.getBatteryLevel();
    
    if (batteryLevel < 20) {
      // Enable aggressive optimizations
      this.config.enableCaching = true;
      this.config.enableBatching = true;
      this.config.batchSize = 20; // Larger batches
      this.config.debounceMs = 500; // Longer debounce
      
      // Reduce cache size to save memory
      this.config.maxCacheSize = 50 * 1024 * 1024; // 50MB
      
      // Clear old cache entries
      await this.cleanupCache();
    } else if (batteryLevel < 50) {
      // Moderate optimizations
      this.config.batchSize = 15;
      this.config.debounceMs = 400;
    } else {
      // Normal performance settings
      this.config.batchSize = 10;
      this.config.debounceMs = 300;
      this.config.maxCacheSize = 100 * 1024 * 1024; // 100MB
    }
  }

  // Get performance recommendations
  async getRecommendations(): Promise<string[]> {
    const report = performanceMonitor.getReport();
    const recommendations: string[] = [...report.summary.recommendations];
    
    // Check response times
    if (report.summary.averageResponseTime > 200) {
      recommendations.push(
        `Average response time is ${report.summary.averageResponseTime.toFixed(1)}ms. Consider enabling batching and caching.`
      );
    }
    
    // Check for slow operations
    const slowOperations = report.summary.slowestOperations
      .filter(op => op.value > 200)
      .map(op => op.name);
    
    if (slowOperations.length > 0) {
      recommendations.push(
        `Slow operations detected: ${slowOperations.join(', ')}. Consider optimization.`
      );
    }
    
    // Check cache hit rate
    const cacheStats = await cacheManager.getStats();
    if (cacheStats.hitRate < 0.8) {
      recommendations.push(
        `Cache hit rate is ${(cacheStats.hitRate * 100).toFixed(1)}%. Consider increasing cache TTL or improving cache keys.`
      );
    }
    
    // Check battery level
    const batteryLevel = await powerManager.getBatteryLevel();
    if (batteryLevel < 30) {
      recommendations.push(
        'Low battery detected. Enable eco mode and reduce background operations.'
      );
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal! All metrics are within acceptable ranges.');
    }
    
    return recommendations;
  }

  // Private helper methods
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async isImageInViewport(imageUrl: string): Promise<boolean> {
    // Simple viewport check - in a real implementation, this would use Intersection Observer
    return true; // Simplified for demo
  }

  private generatePlaceholder(width?: number, height?: number): string {
    const w = width || 300;
    const h = height || 200;
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Loading...</text>
      </svg>
    `)}`;
  }

  private async compressImage(imageUrl: string, options: any): Promise<string> {
    // Simplified compression - in a real implementation, this would use canvas or WebP
    return imageUrl; // Return original for demo
  }

  private async backgroundUpdate<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const result = await queryFn();
      await cacheManager.set(key, result, { ttl });
    } catch (error) {
      console.error('Background update failed:', error);
    }
  }

  private async cleanupCache(): Promise<void> {
    // Remove old cache entries to free up memory
    cacheManager.clear();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;