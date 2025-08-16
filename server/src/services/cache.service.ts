/**
 * @fileoverview Centralized cache service with TTL, LRU eviction, and metrics
 * @module services/cache.service
 */

export type CacheType = 'status' | 'metadata' | 'children' | 'default';

export interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRatio: number;
}

export interface CacheEvent {
  key: string;
  type: CacheType;
  value?: unknown;
  reason?: string;
}

type EventCallback = (event: CacheEvent) => void;

interface CacheEntry {
  value: unknown;
  expires: number;
  lastAccessed: number;
}

/**
 * Centralized cache service with TTL, LRU eviction, and metrics tracking
 */
export class CacheService {
  private caches: Map<CacheType, Map<string, CacheEntry>>;
  private configs: Map<CacheType, CacheConfig>;
  private metrics: Map<CacheType, Omit<CacheMetrics, 'hitRatio' | 'size'>>;
  private eventHandlers: Map<string, Set<EventCallback>>;
  private accessCounter: number;

  constructor() {
    this.caches = new Map();
    this.configs = new Map();
    this.metrics = new Map();
    this.eventHandlers = new Map();
    this.accessCounter = 0;

    // Initialize default cache types
    const cacheTypes: CacheType[] = ['status', 'metadata', 'children', 'default'];
    cacheTypes.forEach(type => {
      this.caches.set(type, new Map());
      this.configs.set(type, { ttl: 30000, maxSize: 1000 });
      this.metrics.set(type, { hits: 0, misses: 0, evictions: 0 });
    });
  }

  /**
   * Configure a cache type with specific settings
   */
  configure(type: CacheType, config: CacheConfig): void {
    this.configs.set(type, config);
  }

  /**
   * Get configuration for a cache type
   */
  getConfiguration(type: CacheType): CacheConfig {
    return this.configs.get(type) || { ttl: 30000, maxSize: 1000 };
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: unknown, type: CacheType = 'default'): void {
    const cache = this.caches.get(type);
    const config = this.configs.get(type);
    
    if (!cache || !config) return;

    // Check if we need to evict due to size limit
    if (cache.size >= config.maxSize) {
      this.evictLRU(type);
    }

    // Use counter for LRU tracking to ensure uniqueness
    const now = Date.now();
    cache.set(key, {
      value,
      expires: now + config.ttl,
      lastAccessed: ++this.accessCounter
    });
  }

  /**
   * Get a value from the cache
   */
  get(key: string, type: CacheType = 'default'): unknown | null {
    const cache = this.caches.get(type);
    const metrics = this.metrics.get(type);
    
    if (!cache || !metrics) return null;

    const entry = cache.get(key);
    
    if (!entry) {
      metrics.misses++;
      this.emit('miss', { key, type });
      return null;
    }

    const now = Date.now();
    
    // Check if expired
    if (entry.expires < now) {
      cache.delete(key);
      metrics.misses++;
      this.emit('miss', { key, type });
      return null;
    }

    // Update last accessed time with counter
    entry.lastAccessed = ++this.accessCounter;
    metrics.hits++;
    this.emit('hit', { key, type, value: entry.value });
    
    return entry.value;
  }

  /**
   * Clear a specific cache type
   */
  clear(type: CacheType): void {
    const cache = this.caches.get(type);
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }

  /**
   * Get metrics for a specific cache type
   */
  getMetrics(type: CacheType): CacheMetrics {
    const metrics = this.metrics.get(type);
    const cache = this.caches.get(type);
    
    if (!metrics || !cache) {
      return { hits: 0, misses: 0, evictions: 0, size: 0, hitRatio: 0 };
    }

    const total = metrics.hits + metrics.misses;
    const hitRatio = total > 0 ? metrics.hits / total : 0;

    return {
      ...metrics,
      size: cache.size,
      hitRatio
    };
  }

  /**
   * Get metrics for all cache types
   */
  getAllMetrics(): Record<CacheType, CacheMetrics> {
    const result: Partial<Record<CacheType, CacheMetrics>> = {};
    
    const cacheTypes: CacheType[] = ['status', 'metadata', 'children', 'default'];
    cacheTypes.forEach(type => {
      result[type] = this.getMetrics(type);
    });

    return result as Record<CacheType, CacheMetrics>;
  }

  /**
   * Subscribe to cache events
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(callback);
  }

  /**
   * Unsubscribe from cache events
   */
  off(event: string, callback: EventCallback): void {
    this.eventHandlers.get(event)?.delete(callback);
  }

  /**
   * Emit a cache event
   */
  private emit(event: string, data: CacheEvent): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Evict the least recently used item from a cache
   */
  private evictLRU(type: CacheType): void {
    const cache = this.caches.get(type);
    const metrics = this.metrics.get(type);
    
    if (!cache || !metrics || cache.size === 0) return;

    let lruKey: string | null = null;
    let lruTime = Infinity;

    // Find the least recently accessed item
    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      cache.delete(lruKey);
      metrics.evictions++;
      this.emit('evict', { key: lruKey, type, reason: 'lru' });
    }
  }
}