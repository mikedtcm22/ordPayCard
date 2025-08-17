/**
 * Tests for EmbersCore build output and size constraints
 * Ensures the library bundle meets size requirements for on-chain inscription
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';
import { execSync } from 'child_process';

describe('EmbersCore Build Size', () => {
  const distPath = join(__dirname, '../../dist/embers-core');
  const bundlePath = join(distPath, 'embers-core.min.js');
  
  beforeAll(() => {
    // Trigger build before tests
    try {
      execSync('npm run build:embers-core', {
        cwd: join(__dirname, '../../../..'), // client root
        stdio: 'ignore'
      });
    } catch (error) {
      // Build command doesn't exist yet, which is expected in RED phase
    }
  });

  it('should produce a single minified bundle file', () => {
    expect(existsSync(bundlePath)).toBe(true);
  });

  it('should have bundle size ≤ 8KB when gzipped', () => {
    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not found - build failed');
    }
    
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    const gzippedSize = gzipSync(bundleContent).length;
    const sizeInKB = gzippedSize / 1024;
    
    console.log(`Bundle size: ${sizeInKB.toFixed(2)}KB (gzipped)`);
    expect(sizeInKB).toBeLessThanOrEqual(8);
  });

  it('should have no external dependencies in bundle', () => {
    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not found - build failed');
    }
    
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    
    // Check for common signs of external dependencies
    // These patterns indicate unbundled imports
    expect(bundleContent).not.toMatch(/require\s*\(['"]/);
    expect(bundleContent).not.toMatch(/import\s+.*\s+from\s+['"]/);
    
    // Should be self-contained IIFE or UMD
    expect(bundleContent).toMatch(/^(\(function|!function|var\s+EmbersCore)/);
  });

  it('should export named functions as tree-shakeable exports', () => {
    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not found - build failed');
    }
    
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    
    // Should expose verifyPayment, dedupe, and SEMVER
    expect(bundleContent).toContain('verifyPayment');
    expect(bundleContent).toContain('dedupe');
    expect(bundleContent).toContain('SEMVER');
    
    // Should be in a format that supports tree-shaking (IIFE with named exports)
    const hasEsmExports = bundleContent.includes('export {') || bundleContent.includes('export function');
    const hasIifeExports = bundleContent.includes('e.verifyPayment') || bundleContent.includes('EmbersCore');
    const hasUmdExports = bundleContent.includes('exports.verifyPayment');
    
    expect(hasEsmExports || hasIifeExports || hasUmdExports).toBe(true);
  });

  it('should include minification (no unnecessary whitespace or comments)', () => {
    if (!existsSync(bundlePath)) {
      throw new Error('Bundle not found - build failed');
    }
    
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    const lines = bundleContent.split('\n');
    
    // Minified code should have very few lines (most code on single lines)
    expect(lines.length).toBeLessThan(50);
    
    // Should not have JSDoc comments in minified output
    expect(bundleContent).not.toMatch(/\/\*\*[\s\S]*?\*\//);
    
    // Should not have excessive whitespace
    const whitespaceRatio = (bundleContent.match(/\s{2,}/g) || []).length / bundleContent.length;
    expect(whitespaceRatio).toBeLessThan(0.01);
  });

  it('should generate source maps for debugging', () => {
    const sourceMapPath = `${bundlePath}.map`;
    expect(existsSync(sourceMapPath)).toBe(true);
    
    if (existsSync(bundlePath)) {
      const bundleContent = readFileSync(bundlePath, 'utf-8');
      // Source map comment should be at the end of the file
      expect(bundleContent).toContain('//# sourceMappingURL=embers-core.min.js.map');
    }
  });
});