/**
 * Tests for EmbersCore loader snippet
 * Ensures parent inscriptions can dynamically load the latest library version
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

describe('EmbersCore Loader', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a fresh DOM environment for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://ordinals.com',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
    
    // Mock fetch API
    fetchMock = vi.fn();
    window.fetch = fetchMock;
    
    // Make window/document available globally for the loader
    global.window = window as any;
    global.document = document as any;
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete global.window;
    delete global.document;
    delete global.fetch;
  });

  it('should export loadEmbersCore function', async () => {
    const { loadEmbersCore } = await import('../loader');
    expect(loadEmbersCore).toBeDefined();
    expect(typeof loadEmbersCore).toBe('function');
  });

  it('should fetch children from correct ordinals endpoint', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'abc123parent';
    
    // Mock the children endpoint response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: 'child1', height: 100 },
          { id: 'child2', height: 200 }, // Latest child
          { id: 'child3', height: 150 }
        ]
      })
    });
    
    // Mock the content endpoint for latest child
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'window.EmbersCore = { loaded: true };'
    });
    
    await loadEmbersCore({ parentId });
    
    // Should fetch children from correct endpoint
    expect(fetchMock).toHaveBeenCalledWith(`/r/children/${parentId}`);
  });

  it('should identify and load the latest child by height', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'abc123parent';
    
    // Mock children with different heights
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: 'old-child', height: 100 },
          { id: 'latest-child', height: 300 }, // This should be selected
          { id: 'middle-child', height: 200 }
        ]
      })
    });
    
    // Mock content fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'window.EmbersCore = { version: "1.0.0" };'
    });
    
    await loadEmbersCore({ parentId });
    
    // Should fetch the latest child's content
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/content/latest-child');
  });

  it('should inject script tag with loaded content', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'test-parent';
    const scriptContent = 'window.EmbersCore = { SEMVER: "1.0.0", verifyPayment: function() {} };';
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 'child1', height: 100 }]
      })
    });
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => scriptContent
    });
    
    await loadEmbersCore({ parentId });
    
    // Should have appended a script tag
    const scripts = document.querySelectorAll('script');
    expect(scripts.length).toBeGreaterThan(0);
    
    // Last script should contain the loaded content
    const lastScript = scripts[scripts.length - 1];
    expect(lastScript.textContent).toBe(scriptContent);
    
    // EmbersCore should be available on window
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.SEMVER).toBe('1.0.0');
  });

  it('should only load once even if called multiple times', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'test-parent';
    
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: 'child1', height: 100 }]
      }),
      text: async () => 'window.EmbersCore = {};'
    });
    
    // Call multiple times
    const promise1 = loadEmbersCore({ parentId });
    const promise2 = loadEmbersCore({ parentId });
    const promise3 = loadEmbersCore({ parentId });
    
    await Promise.all([promise1, promise2, promise3]);
    
    // Should only fetch once
    expect(fetchMock).toHaveBeenCalledTimes(2); // Once for children, once for content
    
    // Should only inject one script
    const scripts = document.querySelectorAll('script[data-embers-core]');
    expect(scripts.length).toBe(1);
  });

  it('should handle fetch errors gracefully', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'error-parent';
    
    // Mock fetch failure
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    
    // Should not throw, but log error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await loadEmbersCore({ parentId });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load EmbersCore'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle empty children list', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'no-children-parent';
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: []
      })
    });
    
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await loadEmbersCore({ parentId });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No children found')
    );
    
    consoleSpy.mockRestore();
  });

  it('should support custom base URL for testing', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'test-parent';
    const baseUrl = 'https://testnet.ordinals.com';
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 'child1', height: 100 }]
      })
    });
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'window.EmbersCore = {};'
    });
    
    await loadEmbersCore({ parentId, baseUrl });
    
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/r/children/${parentId}`);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/content/child1`);
  });

  it('should call onLoad callback after successful load', async () => {
    const { loadEmbersCore } = await import('../loader');
    const parentId = 'callback-parent';
    const onLoad = vi.fn();
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ id: 'child1', height: 100 }]
      })
    });
    
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => 'window.EmbersCore = { loaded: true };'
    });
    
    await loadEmbersCore({ parentId, onLoad });
    
    expect(onLoad).toHaveBeenCalledWith(window.EmbersCore);
  });
});