/**
 * Performance Monitoring Service
 * 
 * Monitors application performance metrics and provides optimization insights
 * for the MEUGRIND productivity system.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'resource' | 'paint' | 'interaction' | 'custom';
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageResponseTime: number;
    slowestOperations: PerformanceMetric[];
    recommendations: string[];
  };
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private readonly maxMetrics = 1000; // Limit stored metrics for memory management

  constructor() {
    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  private initialize() {
    if (typeof window === 'undefined') return;

    try {
      // Monitor navigation timing
      this.observeNavigationTiming();
      
      // Monitor resource loading
      this.observeResourceTiming();
      
      // Monitor paint timing
      this.observePaintTiming();
      
      // Monitor layout shifts
      this.observeLayoutShifts();
      
      // Monitor first input delay
      this.observeFirstInputDelay();

      this.isMonitoring = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  /**
   * Monitor navigation timing metrics
   */
  private observeNavigationTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          this.addMetric({
            name: 'navigation.domContentLoaded',
            value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            timestamp: Date.now(),
            category: 'navigation',
            metadata: {
              type: navEntry.type,
              redirectCount: navEntry.redirectCount,
            },
          });

          this.addMetric({
            name: 'navigation.loadComplete',
            value: navEntry.loadEventEnd - navEntry.loadEventStart,
            timestamp: Date.now(),
            category: 'navigation',
          });

          this.addMetric({
            name: 'navigation.totalTime',
            value: navEntry.loadEventEnd - navEntry.fetchStart,
            timestamp: Date.now(),
            category: 'navigation',
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observer failed:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Only monitor significant resources
          if (resourceEntry.duration > 100) {
            this.addMetric({
              name: 'resource.loadTime',
              value: resourceEntry.duration,
              timestamp: Date.now(),
              category: 'resource',
              metadata: {
                name: resourceEntry.name,
                size: resourceEntry.transferSize,
                type: this.getResourceType(resourceEntry.name),
              },
            });
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observer failed:', error);
    }
  }

  /**
   * Monitor paint timing metrics
   */
  private observePaintTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          this.addMetric({
            name: `paint.${entry.name}`,
            value: entry.startTime,
            timestamp: Date.now(),
            category: 'paint',
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Paint timing observer failed:', error);
    }
  }

  /**
   * Monitor layout shifts (CLS)
   */
  private observeLayoutShifts() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          this.addMetric({
            name: 'interaction.layoutShift',
            value: (entry as any).value,
            timestamp: Date.now(),
            category: 'interaction',
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift observer failed:', error);
    }
  }

  /**
   * Monitor first input delay (FID)
   */
  private observeFirstInputDelay() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.addMetric({
            name: 'interaction.firstInputDelay',
            value: (entry as any).processingStart - entry.startTime,
            timestamp: Date.now(),
            category: 'interaction',
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('First input delay observer failed:', error);
    }
  }

  /**
   * Add a custom performance metric
   */
  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Limit stored metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `custom.${name}`,
        value: duration,
        timestamp: Date.now(),
        category: 'custom',
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `custom.${name}.error`,
        value: duration,
        timestamp: Date.now(),
        category: 'custom',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `custom.${name}`,
        value: duration,
        timestamp: Date.now(),
        category: 'custom',
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.addMetric({
        name: `custom.${name}.error`,
        value: duration,
        timestamp: Date.now(),
        category: 'custom',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }

  /**
   * Mark a custom timing point
   */
  mark(name: string, metadata?: Record<string, any>) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
    }
    
    this.addMetric({
      name: `mark.${name}`,
      value: performance.now(),
      timestamp: Date.now(),
      category: 'custom',
      metadata,
    });
  }

  /**
   * Measure time between two marks
   */
  measureBetweenMarks(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        this.addMetric({
          name: `measure.${name}`,
          value: measure.duration,
          timestamp: Date.now(),
          category: 'custom',
        });
      } catch (error) {
        console.warn('Failed to measure between marks:', error);
      }
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes
    
    const responseTimeMetrics = recentMetrics.filter(m => 
      m.name.includes('custom.') || m.name.includes('resource.') || m.name.includes('navigation.')
    );
    
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;
    
    const slowestOperations = [...recentMetrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    const recommendations = this.generateRecommendations(recentMetrics);
    
    return {
      metrics: recentMetrics,
      summary: {
        totalMetrics: recentMetrics.length,
        averageResponseTime,
        slowestOperations,
        recommendations,
      },
      timestamp: now,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    // Check for slow operations
    const slowOperations = metrics.filter(m => m.value > 200);
    if (slowOperations.length > 0) {
      recommendations.push(`${slowOperations.length} operations took longer than 200ms. Consider optimization.`);
    }
    
    // Check for layout shifts
    const layoutShifts = metrics.filter(m => m.name === 'interaction.layoutShift');
    const totalCLS = layoutShifts.reduce((sum, m) => sum + m.value, 0);
    if (totalCLS > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Review element sizing and loading.');
    }
    
    // Check for large resources
    const largeResources = metrics.filter(m => 
      m.name === 'resource.loadTime' && 
      m.metadata?.size && 
      m.metadata.size > 1000000 // 1MB
    );
    if (largeResources.length > 0) {
      recommendations.push(`${largeResources.length} resources are larger than 1MB. Consider compression or lazy loading.`);
    }
    
    // Check first input delay
    const fidMetrics = metrics.filter(m => m.name === 'interaction.firstInputDelay');
    const avgFID = fidMetrics.length > 0 
      ? fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length 
      : 0;
    if (avgFID > 100) {
      recommendations.push('First Input Delay is high. Consider reducing JavaScript execution time.');
    }
    
    return recommendations;
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    return 'other';
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get current metrics count
   */
  getMetricsCount(): number {
    return this.metrics.length;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types and monitor
export type { PerformanceMetric, PerformanceReport };
export default performanceMonitor;