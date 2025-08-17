/**
 * Tests for SEMVER auto-read from package.json
 * Ensures version is correctly imported at build time
 */

import { describe, it, expect } from 'vitest';
import { SEMVER, getBuildInfo } from '../index';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('SEMVER Auto-read', () => {
  it('should export SEMVER that matches package.json version', () => {
    // Read the actual package.json
    const packageJsonPath = join(__dirname, '../../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const expectedVersion = packageJson.version;
    
    // SEMVER should match package.json version
    expect(SEMVER).toBe(expectedVersion);
  });

  it('should provide getBuildInfo function', () => {
    const buildInfo = getBuildInfo();
    
    expect(buildInfo).toHaveProperty('version');
    expect(buildInfo).toHaveProperty('timestamp');
    expect(buildInfo).toHaveProperty('gitHash');
    
    // Version should be a valid semver
    expect(buildInfo.version).toMatch(/^\d+\.\d+\.\d+$/);
    
    // Timestamp should be a valid ISO date
    expect(buildInfo.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    
    // Git hash should be a valid hash (or 'unknown' in dev)
    expect(buildInfo.gitHash).toBeTruthy();
  });

  it('should have consistent version across exports', () => {
    const buildInfo = getBuildInfo();
    
    // SEMVER and buildInfo.version should match
    expect(SEMVER).toBe(buildInfo.version);
  });

  it('should update SEMVER when package.json changes', () => {
    // This test validates that the build process updates SEMVER
    // It will pass once we implement the build-time injection
    
    // SEMVER should not be hardcoded to '1.0.0'
    const packageJsonPath = join(__dirname, '../../../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    
    if (packageJson.version !== '1.0.0') {
      // If package.json version is different, SEMVER should match it
      expect(SEMVER).not.toBe('1.0.0');
      expect(SEMVER).toBe(packageJson.version);
    }
  });
});