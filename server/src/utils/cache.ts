/**
 * Shared cache utility for reusable TTL-based caching across routes
 * Part of C1 refactor for extracting in-route cache logic
 */

export interface CacheEntry<T = unknown> {
  data: T;
  expiresAtMs: number;
}

export interface CacheOptions {
  /** TTL in milliseconds */
  ttlMs: number;
  /** Optional cleanup interval in milliseconds */
  cleanupIntervalMs?: number;
}

/**
 * Simple TTL-based cache with automatic expiration
 */
export class SimpleCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(private options: CacheOptions) {
    if (options.cleanupIntervalMs) {
      this.startCleanup();
    }
  }

  /**
   * Get cached value if not expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAtMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached value with TTL
   */
  set(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAtMs: now + this.options.ttlMs,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (includes expired entries until cleanup)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Manually clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAtMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupIntervalMs);
  }

  /**
   * Stop cleanup and clear cache
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }
}
