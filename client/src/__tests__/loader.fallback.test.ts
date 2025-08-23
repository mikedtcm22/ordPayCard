/**
 * Tests for embers-core loader fallback mechanism and error reporting
 * Verifies multi-source fallback: inscription -> CDN -> local bundle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmbersLoader, LoaderError, LoaderSource } from '../lib/loader/embersLoader';

describe('EmbersLoader - fallback and error reporting', () => {
  let loader: EmbersLoader;
  let fetchMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    // Mock global fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    
    // Create loader instance with test configuration
    loader = new EmbersLoader({
      inscriptionId: 'test-inscription-id',
      cdnUrl: 'https://cdn.example.com/embers-core.js',
      localPath: '/local/embers-core.js',
      timeout: 1000 // 1 second timeout for tests
    });
    
    // Mock timers for deterministic timeout testing
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  
  describe('successful loading', () => {
    it('should load from inscription source without attempting fallbacks', async () => {
      // Arrange
      const mockScript = 'console.log("embers-core loaded");';
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript
      });
      
      // Act
      const result = await loader.load();
      
      // Assert
      expect(result.source).toBe(LoaderSource.INSCRIPTION);
      expect(result.content).toBe(mockScript);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('test-inscription-id'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });
  
  describe('fallback mechanism', () => {
    it('should fall back to CDN when inscription fetch fails', async () => {
      // Arrange
      const mockScript = 'console.log("cdn embers-core");';
      
      // First call fails (inscription)
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call succeeds (CDN)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript
      });
      
      // Act
      const result = await loader.load();
      
      // Assert
      expect(result.source).toBe(LoaderSource.CDN);
      expect(result.content).toBe(mockScript);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenNthCalledWith(2,
        'https://cdn.example.com/embers-core.js',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
    
    it('should fall back to local bundle when both inscription and CDN fail', async () => {
      // Arrange
      const mockScript = 'console.log("local embers-core");';
      
      // First call fails (inscription)
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      
      // Second call fails (CDN)
      fetchMock.mockRejectedValueOnce(new Error('CDN unavailable'));
      
      // Third call succeeds (local)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript
      });
      
      // Act
      const result = await loader.load();
      
      // Assert
      expect(result.source).toBe(LoaderSource.LOCAL);
      expect(result.content).toBe(mockScript);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenNthCalledWith(3,
        '/local/embers-core.js',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
    
    it('should handle timeout errors with fallback', async () => {
      // Arrange
      const mockScript = 'console.log("cdn after timeout");';
      
      // First call will timeout - simulate AbortError
      fetchMock.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });
      
      // Second call succeeds (CDN)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript
      });
      
      // Act
      const loadPromise = loader.load();
      
      // Advance timers to trigger the abort
      await vi.advanceTimersByTimeAsync(1001);
      
      const result = await loadPromise;
      
      // Assert
      expect(result.source).toBe(LoaderSource.CDN);
      expect(result.content).toBe(mockScript);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('timed out');
    });
  });
  
  describe('error reporting', () => {
    it('should provide actionable error when inscription fetch fails', async () => {
      // Arrange
      const mockScript = 'console.log("fallback");';
      
      // Inscription fails with network error
      fetchMock.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      // CDN succeeds
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript
      });
      
      // Act
      const result = await loader.load();
      
      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBeInstanceOf(LoaderError);
      expect(result.errors[0].message).toContain('Failed to load from inscription');
      expect(result.errors[0].message).toContain('test-inscription-id');
      expect(result.errors[0].hint).toContain('check ord sync');
    });
    
    it('should accumulate errors from multiple failed sources', async () => {
      // Arrange
      // All sources fail
      fetchMock.mockRejectedValueOnce(new Error('Inscription network error'));
      fetchMock.mockRejectedValueOnce(new Error('CDN 503 Service Unavailable'));
      fetchMock.mockRejectedValueOnce(new Error('Local file not found'));
      
      // Act
      let error: Error | undefined;
      try {
        await loader.load();
      } catch (e) {
        error = e as Error;
      }
      
      // Assert
      expect(error).toBeInstanceOf(LoaderError);
      expect(error!.message).toContain('Failed to load embers-core from all sources');
      
      const loaderError = error as LoaderError;
      expect(loaderError.errors).toHaveLength(3);
      expect(loaderError.errors[0].source).toBe(LoaderSource.INSCRIPTION);
      expect(loaderError.errors[1].source).toBe(LoaderSource.CDN);
      expect(loaderError.errors[2].source).toBe(LoaderSource.LOCAL);
      expect(loaderError.hint).toContain('fallback');
    });
    
    it('should include URL in error messages for debugging', async () => {
      // Arrange
      fetchMock.mockRejectedValueOnce(new Error('Connection refused'));
      fetchMock.mockRejectedValueOnce(new Error('404 Not Found'));
      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => 'fallback content'
      });
      
      // Act
      const result = await loader.load();
      
      // Assert
      expect(result.errors[0].url).toContain('test-inscription-id');
      expect(result.errors[1].url).toBe('https://cdn.example.com/embers-core.js');
    });
  });
  
  describe('configuration validation', () => {
    it('should throw error for invalid configuration', () => {
      // Act & Assert
      expect(() => new EmbersLoader({
        inscriptionId: '',
        cdnUrl: 'https://cdn.example.com/embers-core.js',
        localPath: '/local/embers-core.js'
      })).toThrow('Invalid inscription ID');
      
      expect(() => new EmbersLoader({
        inscriptionId: 'valid-id',
        cdnUrl: 'not-a-url',
        localPath: '/local/embers-core.js'
      })).toThrow('Invalid CDN URL');
    });
  });
});