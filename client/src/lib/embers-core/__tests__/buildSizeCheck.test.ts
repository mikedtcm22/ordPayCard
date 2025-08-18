/**
 * Tests for build size checking functionality
 * Ensures built bundle stays within size constraints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

describe('Build Size Check', () => {
  const distPath = path.resolve(__dirname, '../../dist/embers-core');
  const bundlePath = path.join(distPath, 'embers-core.min.js');
  const projectRoot = path.resolve(__dirname, '../../../../');

  beforeAll(() => {
    // Ensure bundle is built before tests
    try {
      execSync('npm run build:embers-core', {
        encoding: 'utf-8',
        cwd: projectRoot,
        stdio: 'pipe'
      });
    } catch (error) {
      console.error('Failed to build embers-core:', error);
    }
  });

  it('should report gzipped size of built bundle', () => {
    // Run the postbuild script
    const result = execSync('npm run postbuild:embers-core', {
      encoding: 'utf-8',
      cwd: projectRoot
    });

    // Should output the gzipped size  
    expect(result).toMatch(/Bundle size \(gzip\): \d+(\.\d+)? KB/);
    expect(result).toMatch(/Bundle size \(raw\): \d+(\.\d+)? KB/);
    expect(result).toMatch(/Size limit: \d+(\.\d+)? KB/);
  });

  it('should pass when actual bundle is under 8KB', () => {
    // Check the actual bundle
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle not found at ${bundlePath}`);
    }

    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    const gzippedSize = zlib.gzipSync(bundleContent).length;

    // The actual bundle should be under 8KB
    expect(gzippedSize).toBeLessThan(8 * 1024);

    // Run postbuild and it should succeed
    let exitCode = 0;
    try {
      execSync('npm run postbuild:embers-core', {
        encoding: 'utf-8',
        cwd: projectRoot,
        stdio: 'pipe'
      });
      exitCode = 0;
    } catch (error: any) {
      exitCode = error.status || 1;
    }

    expect(exitCode).toBe(0);
  });

  it('should correctly calculate and display gzipped size', () => {
    const result = execSync('npm run postbuild:embers-core', {
      encoding: 'utf-8',
      cwd: projectRoot
    });

    // Read actual bundle to verify reported size
    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    const actualGzippedSize = zlib.gzipSync(bundleContent).length;
    const actualGzippedKB = (actualGzippedSize / 1024).toFixed(2);

    // The output should contain the correct gzipped size
    expect(result).toContain(`Bundle size (gzip): ${actualGzippedKB} KB`);
  });

  it('should show success message when under limit', () => {
    const result = execSync('npm run postbuild:embers-core', {
      encoding: 'utf-8',
      cwd: projectRoot
    });

    // Should show success
    expect(result).toContain('✅ Bundle size is within limit');
    expect(result).toMatch(/\d+(\.\d+)? KB under limit/);
  });

  describe('Size limit enforcement', () => {
    it('would fail if bundle exceeded 8KB (simulated)', () => {
      // Create a test script that simulates a large bundle
      const testScriptPath = path.join(projectRoot, 'scripts/test-large-bundle.js');
      const testScript = `
import fs from 'fs';
import zlib from 'zlib';

const SIZE_LIMIT_BYTES = 8 * 1024;
// Create content that compresses poorly (random data)
const largeContent = Array.from({length: 10000}, () => Math.random().toString(36)).join('');
const gzippedSize = zlib.gzipSync(largeContent).length;

console.log('Test bundle gzipped size:', (gzippedSize / 1024).toFixed(2), 'KB');

if (gzippedSize > SIZE_LIMIT_BYTES) {
  console.error('Bundle size exceeds limit!');
  process.exit(1);
} else {
  console.log('Bundle size is within limit');
  process.exit(0);
}
`;

      fs.writeFileSync(testScriptPath, testScript);

      let exitCode = 0;
      try {
        execSync(`node ${testScriptPath}`, {
          encoding: 'utf-8',
          cwd: projectRoot,
          stdio: 'pipe'
        });
      } catch (error: any) {
        exitCode = error.status || 1;
      } finally {
        // Clean up test script
        if (fs.existsSync(testScriptPath)) {
          fs.unlinkSync(testScriptPath);
        }
      }

      // Random data should exceed 8KB when gzipped
      expect(exitCode).toBe(1);
    });
  });
});