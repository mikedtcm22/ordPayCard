/**
 * @fileoverview Lightweight metrics collection for monitoring and observability
 * @module utils/metrics
 */

interface RequestMetrics {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  totalRequests: number;
}

interface MetricsData {
  requests: {
    [endpoint: string]: RequestMetrics;
  };
  cache: CacheMetrics;
}

interface ExportedMetrics {
  timestamp: string;
  metrics: Array<{
    name: string;
    value: number;
    labels?: Record<string, string>;
  }>;
}

type MetricsHook = (data: Record<string, unknown>) => void;

export class MetricsCollector {
  private metrics: MetricsData;
  private hooks: Map<string, MetricsHook[]>;

  constructor() {
    this.metrics = this.createEmptyMetrics();
    this.hooks = new Map();
  }

  private createEmptyMetrics(): MetricsData {
    return {
      requests: {},
      cache: {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        totalRequests: 0
      }
    };
  }

  /**
   * Reset all metrics to initial state
   */
  resetMetrics(): void {
    this.metrics = this.createEmptyMetrics();
    // Don't clear hooks - they should persist across resets
  }

  /**
   * Record request timing
   */
  recordRequest(endpoint: string, duration: number): void {
    if (!this.metrics.requests[endpoint]) {
      this.metrics.requests[endpoint] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0
      };
    }

    const reqMetrics = this.metrics.requests[endpoint];
    reqMetrics.count++;
    reqMetrics.totalDuration += duration;
    reqMetrics.averageDuration = reqMetrics.totalDuration / reqMetrics.count;
    reqMetrics.minDuration = Math.min(reqMetrics.minDuration, duration);
    reqMetrics.maxDuration = Math.max(reqMetrics.maxDuration, duration);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(hit: boolean, key: string): void {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    this.metrics.cache.totalRequests++;
    this.metrics.cache.hitRatio = 
      this.metrics.cache.totalRequests > 0 
        ? this.metrics.cache.hits / this.metrics.cache.totalRequests 
        : 0;

    // Trigger cache operation hook
    this.triggerHook('cacheOperation', {
      operation: 'get',
      hit,
      key
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): MetricsData {
    return { ...this.metrics };
  }

  /**
   * Export metrics in monitoring-friendly format
   */
  exportMetrics(): ExportedMetrics {
    const exported: ExportedMetrics = {
      timestamp: new Date().toISOString(),
      metrics: []
    };

    // Export request metrics
    for (const [endpoint, metrics] of Object.entries(this.metrics.requests)) {
      exported.metrics.push({
        name: 'http_request_duration_ms',
        value: metrics.averageDuration,
        labels: { endpoint }
      });
      exported.metrics.push({
        name: 'http_request_count',
        value: metrics.count,
        labels: { endpoint }
      });
    }

    // Export cache metrics
    exported.metrics.push({
      name: 'cache_hit_ratio',
      value: this.metrics.cache.hitRatio
    });
    exported.metrics.push({
      name: 'cache_hits_total',
      value: this.metrics.cache.hits
    });
    exported.metrics.push({
      name: 'cache_misses_total',
      value: this.metrics.cache.misses
    });

    return exported;
  }

  /**
   * Register a hook for custom metrics collection
   */
  registerHook(event: string, callback: MetricsHook): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    const hooks = this.hooks.get(event);
    if (hooks) {
      hooks.push(callback);
    }
  }

  /**
   * Trigger hooks for an event
   */
  triggerHook(event: string, data: Record<string, unknown>): void {
    const hooks = this.hooks.get(event);
    if (hooks) {
      hooks.forEach(hook => hook(data));
    }
  }

  /**
   * Get metrics for API response
   */
  getApiMetrics(): {
    timestamp: string;
    metrics: {
      requests: Record<string, RequestMetrics>;
      cache: CacheMetrics;
    };
  } {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        requests: this.metrics.requests,
        cache: this.metrics.cache
      }
    };
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

// Export functions
export const resetMetrics = () => metricsCollector.resetMetrics();
export const recordRequest = (endpoint: string, duration: number) => 
  metricsCollector.recordRequest(endpoint, duration);
export const recordCacheOperation = (hit: boolean, key: string) => 
  metricsCollector.recordCacheOperation(hit, key);
export const getMetrics = () => metricsCollector.getMetrics();
export const exportMetrics = () => metricsCollector.exportMetrics();
export const registerHook = (event: string, callback: MetricsHook) => 
  metricsCollector.registerHook(event, callback);
export const triggerHook = (event: string, data: Record<string, unknown>) => 
  metricsCollector.triggerHook(event, data);
export const getApiMetrics = () => metricsCollector.getApiMetrics();

// Default export for require() compatibility
export default {
  resetMetrics,
  recordRequest,
  recordCacheOperation,
  getMetrics,
  exportMetrics,
  registerHook,
  triggerHook,
  getApiMetrics
};