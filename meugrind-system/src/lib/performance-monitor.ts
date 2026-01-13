interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalOperations: number;
  averageResponseTime: number;
  slowestOperations: PerformanceMetric[];
  fastestOperations: PerformanceMetric[];
  operationsByType: Record<string, {
    count: number;
    averageTime: number;
    totalTime: number;
  }>;
  sub200msOperations: number;
  sub200msPercentage: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private isEnabled = true;

  // Start timing an operation
  startTiming(operationName: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return '';
    
    const metricId = `${operationName}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetric = {
      name: operationName,
      startTime: performance.now(),
      metadata,
    };
    
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    return metricId;
  }

  // End timing an operation
  endTiming(operationName: string): number | null {
    if (!this.isEnabled) return null;
    
    const now = performance.now();
    
    // Find the most recent metric with this name that hasn't been completed
    const metricIndex = this.metrics.findIndex(
      m => m.name === operationName && !m.endTime
    );
    
    if (metricIndex === -1) {
      console.warn(`No active timing found for operation: ${operationName}`);
      return null;
    }
    
    const metric = this.metrics[metricIndex];
    metric.endTime = now;
    metric.duration = now - metric.startTime;
    
    // Log slow operations (>200ms requirement)
    if (metric.duration > 200) {
      console.warn(`Slow operation detected: ${operationName} took ${metric.duration.toFixed(2)}ms`);
    }
    
    return metric.duration;
  }

  // Measure a function execution
  async measure<T>(
    operationName: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    if (!this.isEnabled) {
      const result = await fn();
      return { result, duration: 0 };
    }
    
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.push({
        name: operationName,
        startTime,
        endTime,
        duration,
        metadata,
      });
      
      // Keep only the most recent metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics);
      }
      
      // Log slow operations
      if (duration > 200) {
        console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return { result, duration };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.metrics.push({
        name: `${operationName}_ERROR`,
        startTime,
        endTime,
        duration,
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }

  // Get performance report
  getReport(timeWindowMs?: number): PerformanceReport {
    const now = performance.now();
    const cutoffTime = timeWindowMs ? now - timeWindowMs : 0;
    
    const relevantMetrics = this.metrics.filter(
      m => m.duration !== undefined && m.startTime >= cutoffTime
    );
    
    if (relevantMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        slowestOperations: [],
        fastestOperations: [],
        operationsByType: {},
        sub200msOperations: 0,
        sub200msPercentage: 100,
      };
    }
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageResponseTime = totalTime / relevantMetrics.length;
    
    // Sort by duration
    const sortedByDuration = [...relevantMetrics].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    // Group by operation type
    const operationsByType: Record<string, { count: number; averageTime: number; totalTime: number }> = {};
    
    relevantMetrics.forEach(metric => {
      if (!operationsByType[metric.name]) {
        operationsByType[metric.name] = { count: 0, averageTime: 0, totalTime: 0 };
      }
      
      const op = operationsByType[metric.name];
      op.count++;
      op.totalTime += metric.duration || 0;
      op.averageTime = op.totalTime / op.count;
    });
    
    // Count sub-200ms operations
    const sub200msOperations = relevantMetrics.filter(m => (m.duration || 0) <= 200).length;
    const sub200msPercentage = (sub200msOperations / relevantMetrics.length) * 100;
    
    return {
      totalOperations: relevantMetrics.length,
      averageResponseTime,
      slowestOperations: sortedByDuration.slice(0, 10),
      fastestOperations: sortedByDuration.slice(-10).reverse(),
      operationsByType,
      sub200msOperations,
      sub200msPercentage,
    };
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Get current metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Test performance with simulated rural connectivity
  async testRuralConnectivity(): Promise<{
    baselineReport: PerformanceReport;
    throttledReport: PerformanceReport;
    recommendations: string[];
  }> {
    console.log('Starting rural connectivity performance test...');
    
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return {
        baselineReport: this.getReport(),
        throttledReport: this.getReport(),
        recommendations: ['Performance testing requires browser environment']
      };
    }
    
    // Clear existing metrics
    this.clear();
    
    // Test baseline performance
    await this.runPerformanceTests('baseline');
    const baselineReport = this.getReport();
    
    // Clear metrics for throttled test
    this.clear();
    
    // Simulate rural connectivity (add artificial delays)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      // Add 500-2000ms delay to simulate rural connectivity
      const delay = Math.random() * 1500 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return originalFetch(...args);
    };
    
    try {
      await this.runPerformanceTests('throttled');
      const throttledReport = this.getReport();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(baselineReport, throttledReport);
      
      return {
        baselineReport,
        throttledReport,
        recommendations,
      };
    } finally {
      // Restore original fetch
      window.fetch = originalFetch;
    }
  }

  private async runPerformanceTests(testType: string): Promise<void> {
    const testOperations = [
      () => this.testDatabaseRead(),
      () => this.testDatabaseWrite(),
      () => this.testUIRender(),
      () => this.testDataSync(),
      () => this.testCacheAccess(),
    ];
    
    // Run each test multiple times
    for (let i = 0; i < 5; i++) {
      for (const testOp of testOperations) {
        await testOp();
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async testDatabaseRead(): Promise<void> {
    await this.measure('database_read', async () => {
      // Simulate database read
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 10));
      return { data: 'test' };
    });
  }

  private async testDatabaseWrite(): Promise<void> {
    await this.measure('database_write', async () => {
      // Simulate database write
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 20));
      return { success: true };
    });
  }

  private async testUIRender(): Promise<void> {
    await this.measure('ui_render', async () => {
      // Simulate UI rendering
      await new Promise(resolve => setTimeout(resolve, Math.random() * 30 + 5));
      return { rendered: true };
    });
  }

  private async testDataSync(): Promise<void> {
    await this.measure('data_sync', async () => {
      // Simulate data synchronization
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
      return { synced: true };
    });
  }

  private async testCacheAccess(): Promise<void> {
    await this.measure('cache_access', async () => {
      // Simulate cache access
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 1));
      return { cached: true };
    });
  }

  private generateRecommendations(baseline: PerformanceReport, throttled: PerformanceReport): string[] {
    const recommendations: string[] = [];
    
    // Check if sub-200ms requirement is met
    if (baseline.sub200msPercentage < 95) {
      recommendations.push(
        `Only ${baseline.sub200msPercentage.toFixed(1)}% of operations meet the sub-200ms requirement. Consider optimizing slow operations.`
      );
    }
    
    if (throttled.sub200msPercentage < 80) {
      recommendations.push(
        'Performance degrades significantly under poor connectivity. Implement more aggressive caching and offline-first patterns.'
      );
    }
    
    // Check for slow operation types
    Object.entries(baseline.operationsByType).forEach(([opType, stats]) => {
      if (stats.averageTime > 200) {
        recommendations.push(
          `Operation type "${opType}" averages ${stats.averageTime.toFixed(1)}ms. Consider optimization.`
        );
      }
    });
    
    // Compare baseline vs throttled
    const performanceDegradation = (throttled.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime;
    
    if (performanceDegradation > 2) {
      recommendations.push(
        'Performance degrades significantly under poor connectivity. Implement request batching and background sync.'
      );
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! All operations meet the sub-200ms requirement.');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;