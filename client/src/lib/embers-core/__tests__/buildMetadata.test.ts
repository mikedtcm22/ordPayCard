/**
 * Tests for build metadata injection
 * Ensures version, timestamp, and git hash are embedded in bundle
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Build Metadata', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const bundlePath = path.join(projectRoot, 'src/lib/dist/embers-core/embers-core.min.js');
  let EmbersCore: any;

  beforeAll(() => {
    // Build the bundle
    execSync('npm run build:embers-core', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Load the built bundle
    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    
    // Create a mock window/global environment and evaluate the IIFE
    const mockGlobal: any = {};
    const fn = new Function('window', 'global', bundleContent + '; return EmbersCore;');
    EmbersCore = fn(mockGlobal, mockGlobal);
  });

  it('should export a buildInfo object', () => {
    expect(EmbersCore).toHaveProperty('buildInfo');
    expect(typeof EmbersCore.buildInfo).toBe('object');
  });

  it('should include version from package.json', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
    );

    expect(EmbersCore.buildInfo).toHaveProperty('version');
    expect(EmbersCore.buildInfo.version).toBe(packageJson.version);
  });

  it('should include build timestamp', () => {
    expect(EmbersCore.buildInfo).toHaveProperty('timestamp');
    
    // Should be a valid ISO date string
    const timestamp = new Date(EmbersCore.buildInfo.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
    
    // Should be recent (within last hour)
    const now = Date.now();
    const buildTime = timestamp.getTime();
    expect(now - buildTime).toBeLessThan(3600000); // 1 hour
  });

  it('should include git hash', () => {
    expect(EmbersCore.buildInfo).toHaveProperty('gitHash');
    
    // Should be a short hash, 'unknown', or 'development'
    const gitHash = EmbersCore.buildInfo.gitHash;
    expect(typeof gitHash).toBe('string');
    
    if (gitHash !== 'unknown' && gitHash !== 'development') {
      // Should be a valid short git hash (7-8 characters)
      expect(gitHash).toMatch(/^[a-f0-9]{7,8}$/);
    }
  });

  it('should expose buildInfo through public API', () => {
    // Should be accessible and immutable
    const buildInfo = EmbersCore.buildInfo;
    
    // Verify it's frozen (assignment should throw in strict mode or be ignored)
    const originalVersion = buildInfo.version;
    
    // Test that the object is frozen
    expect(Object.isFrozen(buildInfo)).toBe(true);
    
    // Verify values are accessible
    expect(buildInfo.version).toBe(originalVersion);
    expect(typeof buildInfo.timestamp).toBe('string');
    expect(typeof buildInfo.gitHash).toBe('string');
  });

  it('should include buildInfo in minified bundle', () => {
    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    
    // Even in minified code, the injected constants should be present
    // They'll be replaced with actual values during build
    expect(bundleContent).toContain('"0.0.0"'); // version from package.json
  });
});