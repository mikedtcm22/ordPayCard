/**
 * Tests for enhanced loader functionality with resilience and safety features
 * Covers checksum verification, caching, retry logic, and version targeting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadEmbersCore } from '../loader';

// Mock SubtleCrypto for testing
const mockSubtleCrypto = {
  digest: vi.fn()
};

// Mock fetch
global.fetch = vi.fn();

// Mock document
global.document = {
  createElement: vi.fn(() => ({
    setAttribute: vi.fn(),
    textContent: null,
  })),
  body: {
    appendChild: vi.fn()
  }
} as any;

// Mock window
global.window = {
  crypto: {
    subtle: mockSubtleCrypto
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
} as any;

describe('Enhanced Loader Features', () => {
  // Valid inscription ID for testing
  const VALID_PARENT_ID = 'a'.repeat(64) + 'i0';
  const VALID_CHILD_ID = 'b'.repeat(64) + 'i1';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.EmbersCore
    (global.window as any).EmbersCore = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Checksum Verification', () => {
    it('should verify checksum when expectedHash is provided', async () => {
      const scriptContent = 'var EmbersCore = {};';
      const expectedHash = 'abc123def456';
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: 100 }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });

      // Mock crypto.subtle.digest to return expected hash
      const encoder = new TextEncoder();
      const data = encoder.encode(scriptContent);
      const hashBuffer = new ArrayBuffer(32);
      mockSubtleCrypto.digest.mockResolvedValue(hashBuffer);

      await loadEmbersCore({
        parentId: VALID_PARENT_ID,
        expectedHash,
        verifyChecksum: true
      });

      expect(mockSubtleCrypto.digest).toHaveBeenCalledWith('SHA-256', data);
    });

    it('should reject when checksum does not match', async () => {
      const scriptContent = 'var EmbersCore = {};';
      const expectedHash = 'abc123def456';
      const actualHash = 'wronghash789';
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: 100 }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });

      // Mock crypto.subtle.digest to return different hash
      mockSubtleCrypto.digest.mockResolvedValue(new ArrayBuffer(32));

      await expect(loadEmbersCore({
        parentId: VALID_PARENT_ID,
        expectedHash,
        verifyChecksum: true
      })).rejects.toThrow('Checksum verification failed');
    });

    it('should skip checksum verification when not requested', async () => {
      const scriptContent = 'var EmbersCore = {};';
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: 100 }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });

      await loadEmbersCore({
        parentId: 'parent123'
      });

      expect(mockSubtleCrypto.digest).not.toHaveBeenCalled();
    });
  });

  describe('Local Caching', () => {
    it('should cache loaded scripts keyed by parentId and height', async () => {
      const scriptContent = 'var EmbersCore = { SEMVER: "1.0.0" };';
      const parentId = VALID_PARENT_ID;
      const childHeight = 100;
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: childHeight }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });

      await loadEmbersCore({
        parentId,
        enableCache: true
      });

      const cacheKey = `embers-core:${parentId}:${childHeight}`;
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        cacheKey,
        expect.stringContaining(scriptContent)
      );
    });

    it('should use cached version on cache hit', async () => {
      const parentId = VALID_PARENT_ID;
      const childHeight = 100;
      const cachedScript = 'var EmbersCore = { SEMVER: "cached" };';
      const cacheKey = `embers-core:${parentId}:${childHeight}`;
      
      // Mock cache hit
      (window.localStorage.getItem as any).mockReturnValue(JSON.stringify({
        content: cachedScript,
        timestamp: Date.now(),
        height: childHeight
      }));

      // Mock children fetch to return same height (no update)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: childHeight }] })
      });

      await loadEmbersCore({
        parentId,
        enableCache: true
      });

      // Should not fetch content since cache is valid
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only children fetch
    });

    it('should invalidate cache after TTL expires', async () => {
      const parentId = VALID_PARENT_ID;
      const childHeight = 100;
      const cachedScript = 'var EmbersCore = { SEMVER: "old" };';
      const newScript = 'var EmbersCore = { SEMVER: "new" };';
      const cacheKey = `embers-core:${parentId}:${childHeight}`;
      
      // Mock expired cache
      (window.localStorage.getItem as any).mockReturnValue(JSON.stringify({
        content: cachedScript,
        timestamp: Date.now() - 86400000, // 24 hours ago
        height: childHeight
      }));

      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: childHeight }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => newScript
      });

      await loadEmbersCore({
        parentId,
        enableCache: true,
        cacheTTL: 3600000 // 1 hour
      });

      // Should fetch new content due to expired cache
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should retry with exponential backoff on failure', async () => {
      const parentId = VALID_PARENT_ID;
      let attempts = 0;
      
      // Mock failures then success
      (global.fetch as any).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ results: [{ id: 'child1', height: 100 }] })
        });
      });

      // Use fake timers for testing
      vi.useFakeTimers();

      const loadPromise = loadEmbersCore({
        parentId,
        maxRetries: 3,
        retryDelay: 100
      });

      // Advance timers for retries
      await vi.advanceTimersByTimeAsync(1000);

      await loadPromise;

      expect(attempts).toBeGreaterThanOrEqual(2);
      
      vi.useRealTimers();
    });

    it('should apply jitter to retry delays', async () => {
      const parentId = VALID_PARENT_ID;
      const delays: number[] = [];
      
      // Mock failures
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      // Spy on setTimeout to capture delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(fn, 0); // Execute immediately for testing
      }) as any;

      await expect(loadEmbersCore({
        parentId,
        maxRetries: 3,
        retryDelay: 100,
        retryJitter: true
      })).rejects.toThrow();

      // Check that delays have jitter (not all the same)
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it('should stop retrying after max attempts', async () => {
      const parentId = VALID_PARENT_ID;
      let attempts = 0;
      
      // Mock continuous failures
      (global.fetch as any).mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      await expect(loadEmbersCore({
        parentId,
        maxRetries: 3,
        retryDelay: 10
      })).rejects.toThrow('Failed to load after 3 retries');

      expect(attempts).toBeLessThanOrEqual(4); // Initial + 3 retries
    });
  });

  describe('Fallback to Cached Version', () => {
    it('should fallback to last known good version on failure', async () => {
      const parentId = VALID_PARENT_ID;
      const cachedScript = 'var EmbersCore = { SEMVER: "fallback" };';
      
      // Mock cache with last known good version
      (window.localStorage.getItem as any).mockReturnValue(JSON.stringify({
        content: cachedScript,
        timestamp: Date.now(),
        height: 99,
        isLastKnownGood: true
      }));

      // Mock fetch failure
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await loadEmbersCore({
        parentId,
        enableCache: true,
        useFallback: true,
        maxRetries: 0
      });

      // Should use cached version
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should update last known good version on successful load', async () => {
      const parentId = VALID_PARENT_ID;
      const scriptContent = 'var EmbersCore = { SEMVER: "1.0.0" };';
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ id: 'child1', height: 100 }] })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => scriptContent
      });

      await loadEmbersCore({
        parentId,
        enableCache: true
      });

      // Should mark as last known good
      const calls = (window.localStorage.setItem as any).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]).toContain('isLastKnownGood');
    });
  });

  describe('Input Validation', () => {
    it('should validate inscription ID format', async () => {
      await expect(loadEmbersCore({
        parentId: 'invalid-id'
      })).rejects.toThrow('Invalid inscription ID format');

      await expect(loadEmbersCore({} as any))
        .rejects.toThrow('parentId is required');

      await expect(loadEmbersCore({
        parentId: '123'
      })).rejects.toThrow('Invalid inscription ID format');
    });

    it('should accept valid inscription IDs', async () => {
      const validId = 'a'.repeat(64) + 'i0'; // Valid format
      
      // Mock successful fetch
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] })
      });

      await expect(loadEmbersCore({
        parentId: validId
      })).resolves.not.toThrow();
    });
  });

  describe('Parallel Fetching', () => {
    it('should fetch children metadata in parallel with bounded concurrency', async () => {
      // Valid inscription IDs
      const parentIds = [
        'a'.repeat(64) + 'i0',
        'b'.repeat(64) + 'i1', 
        'c'.repeat(64) + 'i2',
        'd'.repeat(64) + 'i3',
        'e'.repeat(64) + 'i4'
      ];
      const fetchPromises: Promise<any>[] = [];
      
      // Track concurrent fetches
      let concurrentFetches = 0;
      let maxConcurrent = 0;
      
      (global.fetch as any).mockImplementation(() => {
        concurrentFetches++;
        maxConcurrent = Math.max(maxConcurrent, concurrentFetches);
        
        const promise = new Promise(resolve => {
          setTimeout(() => {
            concurrentFetches--;
            resolve({
              ok: true,
              json: async () => ({ results: [] })
            });
          }, 10);
        });
        
        fetchPromises.push(promise);
        return promise;
      });

      await loadEmbersCore({
        parentIds,
        maxConcurrency: 3
      });

      // Should respect concurrency limit
      expect(maxConcurrent).toBeLessThanOrEqual(3);
      expect(fetchPromises.length).toBeGreaterThan(0);
    });
  });

  describe('Version Targeting', () => {
    it('should load specific version by height', async () => {
      const parentId = VALID_PARENT_ID;
      const targetHeight = 95;
      
      // Mock children with various heights
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 'child1', height: 90 },
            { id: 'child2', height: 95 },
            { id: 'child3', height: 100 }
          ]
        })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => 'var EmbersCore = { SEMVER: "height-95" };'
      });

      await loadEmbersCore({
        parentId,
        target: { height: targetHeight }
      });

      // Should fetch child2 with height 95
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('child2')
      );
    });

    it('should load specific version by ID', async () => {
      const parentId = VALID_PARENT_ID;
      const targetId = 'b'.repeat(64) + 'i1'; // Valid child ID
      
      // Should skip children fetch and load directly
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'var EmbersCore = { SEMVER: "specific" };'
      });

      await loadEmbersCore({
        parentId,
        target: { id: targetId }
      });

      // Should fetch content directly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(targetId)
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should load latest version by default', async () => {
      const parentId = VALID_PARENT_ID;
      
      // Mock children with various heights
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { id: 'child1', height: 90 },
            { id: 'child3', height: 100 },
            { id: 'child2', height: 95 }
          ]
        })
      }).mockResolvedValueOnce({
        ok: true,
        text: async () => 'var EmbersCore = { SEMVER: "latest" };'
      });

      await loadEmbersCore({
        parentId,
        target: 'latest'
      });

      // Should fetch child3 with highest height
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('child3')
      );
    });
  });
});