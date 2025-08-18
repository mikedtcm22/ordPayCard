/**
 * Tests for size budget manifest functionality
 * Ensures size budget is defined and enforced via manifest file
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('Size Budget Manifest', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const manifestPath = path.join(projectRoot, 'embers-core.size-budget.json');

  it('should have a size budget manifest file', () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
  });

  it('should define size thresholds in the manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Should have required fields
    expect(manifest).toHaveProperty('maxSize');
    expect(manifest).toHaveProperty('compression');
    expect(manifest).toHaveProperty('path');
    
    // Verify values
    expect(manifest.maxSize).toBe('8KB');
    expect(manifest.compression).toBe('gzip');
    expect(manifest.path).toMatch(/embers-core/);
  });

  it('should optionally include warning threshold', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    if (manifest.warnSize) {
      // Warning should be less than max
      const warnBytes = parseSize(manifest.warnSize);
      const maxBytes = parseSize(manifest.maxSize);
      expect(warnBytes).toBeLessThan(maxBytes);
    }
  });

  it('should be used by the postbuild script', () => {
    // The postbuild script should read from the manifest
    const checkScriptPath = path.join(projectRoot, 'scripts/check-bundle-size.js');
    const scriptContent = fs.readFileSync(checkScriptPath, 'utf-8');

    // Should reference the manifest file
    expect(scriptContent).toMatch(/size-budget\.json|sizeBudget/);
  });

  it('should enforce the size defined in manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const maxBytes = parseSize(manifest.maxSize);

    // Build and check
    execSync('npm run build:embers-core', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    const bundlePath = path.resolve(projectRoot, manifest.path);
    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    
    let actualSize: number;
    if (manifest.compression === 'gzip') {
      const zlib = require('zlib');
      actualSize = zlib.gzipSync(bundleContent).length;
    } else {
      actualSize = Buffer.byteLength(bundleContent);
    }

    expect(actualSize).toBeLessThanOrEqual(maxBytes);
  });
});

/**
 * Parse size string to bytes
 */
function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  if (!match) throw new Error(`Invalid size format: ${sizeStr}`);
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  return Math.floor(value * (multipliers[unit] || 1));
}