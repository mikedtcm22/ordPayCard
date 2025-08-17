/**
 * @fileoverview Tests for centralized cache service
 * @module tests/cache.service
 */

import { CacheService } from '../services/cache.service';

describe('Centralized Cache Service', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic functionality', () => {
    it('should store and retrieve values', () => {
      cacheService.set('test-key', { data: 'test-value' }, 'default');
      const result = cacheService.get('test-key', 'default');
      
      expect(result).toEqual({ data: 'test-value' });
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent', 'default');
      expect(result).toBeNull();
    });

    it('should overwrite existing values', () => {
      cacheService.set('key1', 'value1', 'default');
      cacheService.set('key1', 'value2', 'default');
      
      const result = cacheService.get('key1', 'default');
      expect(result).toBe('value2');
    });

    it('should clear specific cache type', () => {
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'metadata');
      
      cacheService.clear('status');
      
      expect(cacheService.get('key1', 'status')).toBeNull();
      expect(cacheService.get('key2', 'metadata')).toBe('value2');
    });

    it('should clear all caches', () => {
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'metadata');
      
      cacheService.clearAll();
      
      expect(cacheService.get('key1', 'status')).toBeNull();
      expect(cacheService.get('key2', 'metadata')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should expire entries after TTL', () => {
      // Configure TTL for status cache to 1 second
      cacheService.configure('status', { ttl: 1000, maxSize: 100 });
      
      cacheService.set('expire-key', 'value', 'status');
      expect(cacheService.get('expire-key', 'status')).toBe('value');
      
      // Advance time by 1.5 seconds
      jest.advanceTimersByTime(1500);
      
      expect(cacheService.get('expire-key', 'status')).toBeNull();
    });

    it('should use different TTLs for different cache types', () => {
      cacheService.configure('status', { ttl: 1000, maxSize: 100 });
      cacheService.configure('metadata', { ttl: 5000, maxSize: 100 });
      
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'metadata');
      
      // Advance time by 2 seconds
      jest.advanceTimersByTime(2000);
      
      // Status cache should be expired
      expect(cacheService.get('key1', 'status')).toBeNull();
      // Metadata cache should still be valid
      expect(cacheService.get('key2', 'metadata')).toBe('value2');
      
      // Advance time by another 4 seconds (total 6 seconds)
      jest.advanceTimersByTime(4000);
      
      // Now metadata cache should also be expired
      expect(cacheService.get('key2', 'metadata')).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used items when max size is reached', () => {
      cacheService.configure('status', { ttl: 60000, maxSize: 3 });
      
      // Add 3 items
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'status');
      cacheService.set('key3', 'value3', 'status');
      
      // Access key1 to make it recently used
      cacheService.get('key1', 'status');
      
      // Add a 4th item, should evict key2 (least recently used)
      cacheService.set('key4', 'value4', 'status');
      
      expect(cacheService.get('key1', 'status')).toBe('value1');
      expect(cacheService.get('key2', 'status')).toBeNull(); // Evicted
      expect(cacheService.get('key3', 'status')).toBe('value3');
      expect(cacheService.get('key4', 'status')).toBe('value4');
    });

    it('should update access time on get operations', () => {
      cacheService.configure('status', { ttl: 60000, maxSize: 2 });
      
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'status');
      
      // Access key1 multiple times
      cacheService.get('key1', 'status');
      cacheService.get('key1', 'status');
      
      // Add key3, should evict key2
      cacheService.set('key3', 'value3', 'status');
      
      expect(cacheService.get('key1', 'status')).toBe('value1');
      expect(cacheService.get('key2', 'status')).toBeNull();
    });
  });

  describe('Metrics tracking', () => {
    it('should track cache hits and misses', () => {
      cacheService.set('key1', 'value1', 'status');
      
      // Get metrics before operations
      const beforeMetrics = cacheService.getMetrics('status');
      const initialHits = beforeMetrics.hits;
      const initialMisses = beforeMetrics.misses;
      
      // Cache hit
      cacheService.get('key1', 'status');
      
      // Cache miss
      cacheService.get('non-existent', 'status');
      
      const afterMetrics = cacheService.getMetrics('status');
      expect(afterMetrics.hits).toBe(initialHits + 1);
      expect(afterMetrics.misses).toBe(initialMisses + 1);
    });

    it('should calculate hit ratio correctly', () => {
      // Reset metrics
      cacheService.clear('status');
      
      // Set initial state
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'status');
      
      // Perform operations: 3 hits, 2 misses
      cacheService.get('key1', 'status'); // hit
      cacheService.get('key2', 'status'); // hit
      cacheService.get('key1', 'status'); // hit
      cacheService.get('missing1', 'status'); // miss
      cacheService.get('missing2', 'status'); // miss
      
      const finalMetrics = cacheService.getMetrics('status');
      expect(finalMetrics.hits).toBe(3);
      expect(finalMetrics.misses).toBe(2);
      expect(finalMetrics.hitRatio).toBeCloseTo(0.6); // 3/(3+2) = 0.6
    });

    it('should track evictions', () => {
      cacheService.configure('status', { ttl: 60000, maxSize: 2 });
      
      const beforeMetrics = cacheService.getMetrics('status');
      const initialEvictions = beforeMetrics.evictions;
      
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'status');
      cacheService.set('key3', 'value3', 'status'); // Should evict key1
      
      const afterMetrics = cacheService.getMetrics('status');
      expect(afterMetrics.evictions).toBe(initialEvictions + 1);
    });

    it('should provide metrics for all cache types', () => {
      cacheService.set('key1', 'value1', 'status');
      cacheService.set('key2', 'value2', 'metadata');
      
      const allMetrics = cacheService.getAllMetrics();
      
      expect(allMetrics).toHaveProperty('status');
      expect(allMetrics).toHaveProperty('metadata');
      expect(allMetrics).toHaveProperty('children');
      
      expect(allMetrics.status.size).toBe(1);
      expect(allMetrics.metadata.size).toBe(1);
      expect(allMetrics.children.size).toBe(0);
    });
  });

  describe('Cache isolation', () => {
    it('should isolate different cache types', () => {
      // Same key in different cache types
      cacheService.set('shared-key', 'status-value', 'status');
      cacheService.set('shared-key', 'metadata-value', 'metadata');
      
      expect(cacheService.get('shared-key', 'status')).toBe('status-value');
      expect(cacheService.get('shared-key', 'metadata')).toBe('metadata-value');
    });

    it('should apply different configurations to different cache types', () => {
      cacheService.configure('status', { ttl: 1000, maxSize: 5 });
      cacheService.configure('metadata', { ttl: 5000, maxSize: 10 });
      
      const statusConfig = cacheService.getConfiguration('status');
      const metadataConfig = cacheService.getConfiguration('metadata');
      
      expect(statusConfig.ttl).toBe(1000);
      expect(statusConfig.maxSize).toBe(5);
      expect(metadataConfig.ttl).toBe(5000);
      expect(metadataConfig.maxSize).toBe(10);
    });
  });

  describe('Observable behavior', () => {
    it('should allow subscribing to cache events', () => {
      const hitCallback = jest.fn();
      const missCallback = jest.fn();
      const evictCallback = jest.fn();
      
      cacheService.on('hit', hitCallback);
      cacheService.on('miss', missCallback);
      cacheService.on('evict', evictCallback);
      
      cacheService.set('key1', 'value1', 'status');
      cacheService.get('key1', 'status'); // hit
      cacheService.get('missing', 'status'); // miss
      
      expect(hitCallback).toHaveBeenCalledWith({
        key: 'key1',
        type: 'status',
        value: 'value1'
      });
      
      expect(missCallback).toHaveBeenCalledWith({
        key: 'missing',
        type: 'status'
      });
      
      // Configure small cache to trigger eviction
      cacheService.configure('status', { ttl: 60000, maxSize: 1 });
      cacheService.set('key2', 'value2', 'status'); // Should evict key1
      
      expect(evictCallback).toHaveBeenCalledWith({
        key: 'key1',
        type: 'status',
        reason: 'lru'
      });
    });

    it('should allow unsubscribing from events', () => {
      const callback = jest.fn();
      
      cacheService.on('hit', callback);
      cacheService.set('key1', 'value1', 'status');
      cacheService.get('key1', 'status');
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      cacheService.off('hit', callback);
      cacheService.get('key1', 'status');
      
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('Integration with existing SimpleCache', () => {
    it('should be compatible with SimpleCache interface', () => {
      // The CacheService should be able to replace SimpleCache
      const cache = cacheService;
      
      cache.set('test', { data: 'value' }, 'status');
      const value = cache.get('test', 'status');
      
      expect(value).toEqual({ data: 'value' });
    });
  });
});