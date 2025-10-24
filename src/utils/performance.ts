import { performance } from 'perf_hooks';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics

  /**
   * Start timing an operation
   */
  startTimer(operation: string): { end: (success?: boolean, error?: string) => void } {
    const startTime = performance.now();

    return {
      end: (success = true, error?: string) => {
        const duration = performance.now() - startTime;
        this.recordMetric({
          operation,
          duration,
          timestamp: new Date(),
          success,
          error,
        });
      },
    };
  }

  /**
   * Wrap an async function with performance monitoring
   */
  async monitor<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(operation);
    try {
      const result = await fn();
      timer.end(true);
      return result;
    } catch (error) {
      timer.end(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.splice(0, this.metrics.length - this.MAX_METRICS);
    }

    // Log slow operations (over 1 second)
    if (metric.duration > 1000) {
      console.warn(
        `⚠️ Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`
      );
    }

    // Log very fast operations that benefit from optimization tracking
    if (metric.duration < 50 && metric.success) {
      console.log(
        `⚡ Fast operation: ${metric.operation} completed in ${metric.duration.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation?: string): {
    totalOperations: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    recentErrors: string[];
  } {
    const filteredMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        recentErrors: [],
      };
    }

    const durations = filteredMetrics.map(m => m.duration);
    const successful = filteredMetrics.filter(m => m.success).length;
    const recentErrors = filteredMetrics
      .filter(m => !m.success && m.error)
      .slice(-5)
      .map(m => m.error!);

    return {
      totalOperations: filteredMetrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: (successful / filteredMetrics.length) * 100,
      recentErrors,
    };
  }

  /**
   * Get top slowest operations
   */
  getSlowestOperations(limit = 10): PerformanceMetric[] {
    return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
  }

  /**
   * Get operations by time range
   */
  getMetricsByTimeRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const slowest = this.getSlowestOperations(5);

    return `
🔍 Performance Monitor Report
==========================
Total Operations: ${stats.totalOperations}
Average Duration: ${stats.averageDuration.toFixed(2)}ms
Success Rate: ${stats.successRate.toFixed(1)}%
Min/Max Duration: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms

🐌 Slowest Operations:
${slowest.map(m => `  • ${m.operation}: ${m.duration.toFixed(2)}ms (${m.success ? '✅' : '❌'})`).join('\n')}

${
  stats.recentErrors.length > 0
    ? `
❌ Recent Errors:
${stats.recentErrors.map(e => `  • ${e}`).join('\n')}
`
    : ''
}
    `.trim();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience function for monitoring database operations
export const monitorDbOperation = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.monitor(`db.${operation}`, fn);
};

// Convenience function for monitoring API operations
export const monitorApiOperation = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.monitor(`api.${operation}`, fn);
};

// Convenience function for monitoring bot operations
export const monitorBotOperation = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.monitor(`bot.${operation}`, fn);
};
