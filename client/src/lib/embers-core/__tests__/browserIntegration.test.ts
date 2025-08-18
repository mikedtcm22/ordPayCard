/**
 * Browser-like integration tests for the built IIFE bundle
 * Ensures the bundle works correctly when loaded via script tag
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

describe('Browser Integration', () => {
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

  it('should load as IIFE in browser-like environment', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously',
      resources: 'usable'
    });

    const window = dom.window as any;
    
    // Execute the IIFE bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Check that EmbersCore is available globally
    expect(window.EmbersCore).toBeDefined();
    expect(typeof window.EmbersCore).toBe('object');
  });

  it('should expose all public API methods in browser', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Check public API
    expect(window.EmbersCore.verifyPayment).toBeDefined();
    expect(window.EmbersCore.dedupe).toBeDefined();
    expect(window.EmbersCore.SEMVER).toBeDefined();
    expect(window.EmbersCore.buildInfo).toBeDefined();
    expect(window.EmbersCore.isValidNetwork).toBeDefined();
  });

  it('should work without any module system', () => {
    // Create a minimal environment without require/import
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Remove any module system globals
    delete window.require;
    delete window.module;
    delete window.exports;
    delete window.define;

    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Should still work
    expect(window.EmbersCore).toBeDefined();
    expect(window.EmbersCore.dedupe(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });

  it('should handle multiple script loads gracefully', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle twice
    const script1 = window.document.createElement('script');
    script1.textContent = bundleContent;
    window.document.body.appendChild(script1);

    const firstRef = window.EmbersCore;

    const script2 = window.document.createElement('script');
    script2.textContent = bundleContent;
    window.document.body.appendChild(script2);

    // Should replace the global (last one wins)
    expect(window.EmbersCore).toBeDefined();
    // Both should work
    expect(firstRef.dedupe).toBeDefined();
    expect(window.EmbersCore.dedupe).toBeDefined();
  });

  it('should work with async/await in browser', async () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Test async function
    const verifyPayment = window.EmbersCore.verifyPayment;
    expect(verifyPayment).toBeDefined();

    // Should return a promise
    const result = verifyPayment('tx', 'addr', 1000n, 'nft', {
      currentBlock: 100,
      network: 'mainnet'
    });

    expect(result).toBeInstanceOf(window.Promise);
    
    // Should resolve to 0n (our stub implementation)
    const value = await result;
    expect(value).toBe(0n);
  });

  it('should maintain correct types for bigint values', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    // Test that BigInt works correctly
    const testBigInt = window.BigInt(123);
    expect(typeof testBigInt).toBe('bigint');

    // Our API should handle BigInt
    const verifyPromise = window.EmbersCore.verifyPayment(
      'tx', 
      'addr', 
      window.BigInt(1000), 
      'nft',
      { currentBlock: 100, network: 'mainnet' }
    );

    expect(verifyPromise).toBeInstanceOf(window.Promise);
  });

  it('should have frozen buildInfo in browser', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      runScripts: 'dangerously'
    });

    const window = dom.window as any;
    
    // Load the bundle
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = bundleContent;
    window.document.body.appendChild(scriptEl);

    const buildInfo = window.EmbersCore.buildInfo;
    expect(window.Object.isFrozen(buildInfo)).toBe(true);
    
    // Should not be able to modify
    const original = buildInfo.version;
    try {
      buildInfo.version = 'hacked';
    } catch {
      // Might throw in strict mode
    }
    expect(buildInfo.version).toBe(original);
  });
});