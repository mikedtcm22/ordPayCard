/**
 * Tests for inscription-like environment compatibility
 * Ensures bundle works with restricted globals and no network access
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

describe('Inscription Environment', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const bundlePath = path.join(projectRoot, 'src/lib/dist/embers-core/embers-core.min.js');
  let bundleContent: string;

  beforeAll(() => {
    // Ensure bundle is built
    execSync('npm run build:embers-core', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    bundleContent = fs.readFileSync(bundlePath, 'utf-8');
  });

  it('should work without network access', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously',
      pretendToBeVisual: false,
      resources: undefined // No resource loading
    });

    const window = dom.window as any;
    
    // Remove network-related APIs
    delete window.fetch;
    delete window.XMLHttpRequest;
    delete window.WebSocket;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Should still work without network
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.dedupe(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('should work with restricted/sandboxed globals', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Simulate restricted inscription environment
    // Remove potentially dangerous or unavailable APIs
    delete window.fetch;
    delete window.XMLHttpRequest;
    delete window.localStorage;
    delete window.sessionStorage;
    delete window.indexedDB;
    delete window.WebSocket;
    delete window.Worker;
    delete window.SharedWorker;
    delete window.ServiceWorker;
    delete window.caches;
    delete window.openDatabase;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Core functionality should work
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.SEMVER).toBeDefined();
    expect(window.EmbersCore.buildInfo).toBeDefined();
  });

  it('should not make any external requests', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Track any network attempts
    let networkAttempted = false;
    
    window.fetch = () => {
      networkAttempted = true;
      throw new Error('Network access not allowed');
    };
    
    window.XMLHttpRequest = function() {
      networkAttempted = true;
      throw new Error('Network access not allowed');
    };

    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Use the API
    window.EmbersCore.dedupe(['a', 'b', 'a']);
    expect(networkAttempted).toBe(false);

    // Even async functions shouldn't attempt network
    const promise = window.EmbersCore.verifyPayment(
      'tx', 'addr', 1000n, 'nft',
      { currentBlock: 100, network: 'mainnet' }
    );
    
    expect(networkAttempted).toBe(false);
  });

  it('should work with minimal DOM API', () => {
    // Create a very minimal DOM environment
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // First load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);
    
    // Now test that it works even if we remove most APIs after loading
    // Keep only essential globals that inscriptions might have
    const essentials = [
      'Object', 'Array', 'String', 'Number', 'Boolean',
      'Function', 'Symbol', 'BigInt', 'Math', 'Date',
      'RegExp', 'Error', 'TypeError', 'ReferenceError',
      'SyntaxError', 'Promise', 'JSON',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'encodeURIComponent', 'decodeURIComponent',
      'encodeURI', 'decodeURI', 'Set', 'Map',
      'EmbersCore' // Our library
    ];

    // Remove non-essential globals (after loading)
    for (const key of Object.keys(window)) {
      if (!essentials.includes(key) && 
          key !== 'undefined' && 
          key !== 'window' && 
          key !== 'self' &&
          key !== 'global' &&
          !key.startsWith('__')) {
        try {
          delete window[key];
        } catch {
          // Some properties can't be deleted
        }
      }
    }

    // Should still work with minimal globals
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.dedupe(['x', 'y', 'x'])).toEqual(['x', 'y']);
    
    // The bundle should work regardless of which APIs are available
    // The important thing is it doesn't depend on them
    expect(typeof window.EmbersCore.verifyPayment).toBe('function');
    expect(typeof window.EmbersCore.buildInfo).toBe('object');
  });

  it('should not depend on console for production use', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Remove console completely
    delete window.console;
    
    // Load the bundle (should not throw even without console)
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Should work without console
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.dedupe(['1', '2', '1'])).toEqual(['1', '2']);
  });

  it('should be pure and deterministic', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Same inputs should produce same outputs
    const input1 = ['a', 'b', 'c', 'a', 'b'];
    const input2 = ['a', 'b', 'c', 'a', 'b'];
    
    const result1 = window.EmbersCore.dedupe(input1);
    const result2 = window.EmbersCore.dedupe(input2);
    
    expect(result1).toEqual(result2);
    expect(result1).toEqual(['a', 'b', 'c']);
    
    // Should not modify inputs
    expect(input1).toEqual(['a', 'b', 'c', 'a', 'b']);
  });

  it('should work in strict mode', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Wrap bundle in strict mode
    const strictBundle = `'use strict';\n${bundleContent}`;
    
    // Load the bundle in strict mode
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = strictBundle;
    window.document.body.appendChild(scriptEl);

    // Should work in strict mode
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.isValidNetwork('mainnet')).toBe(true);
  });

  it('should have no side effects on load', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Track any side effects
    const originalKeys = new Set(Object.keys(window));
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Should only add EmbersCore global
    const newKeys = new Set(Object.keys(window));
    const added = [...newKeys].filter(k => !originalKeys.has(k));
    
    // Should only add the EmbersCore global
    expect(added).toEqual(['EmbersCore']);
  });
});