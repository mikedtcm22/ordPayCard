/**
 * Tests for Embers Core build configuration
 * Verifies network-specific build settings and bundle size optimization
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getBuildConfig, buildEmbersCore } from '../build-config';
import fs from 'fs';
import path from 'path';

describe('Embers Core build configuration', () => {
  describe('getBuildConfig', () => {
    it('should build with network-specific settings for regtest', () => {
      const config = getBuildConfig('regtest');
      expect(config.define.NETWORK).toBe('regtest');
      expect(config.define.ORD_URL).toBe('http://localhost:8080');
    });

    it('should build with network-specific settings for signet', () => {
      const config = getBuildConfig('signet');
      expect(config.define.NETWORK).toBe('signet');
      expect(config.define.ORD_URL).toBe('http://localhost:8080');
    });

    it('should build with network-specific settings for testnet', () => {
      const config = getBuildConfig('testnet');
      expect(config.define.NETWORK).toBe('testnet');
      expect(config.define.ORD_URL).toBe('https://testnet.ordinals.com');
    });

    it('should build with network-specific settings for mainnet', () => {
      const config = getBuildConfig('mainnet');
      expect(config.define.NETWORK).toBe('mainnet');
      expect(config.define.ORD_URL).toBe('https://ordinals.com');
    });

    it('should include minification settings', () => {
      const config = getBuildConfig('signet');
      expect(config.minify).toBe(true);
      expect(config.build.minify).toBe('terser');
      expect(config.build.terserOptions).toBeDefined();
    });

    it('should configure tree shaking', () => {
      const config = getBuildConfig('signet');
      expect(config.build.rollupOptions.treeshake).toBe(true);
    });
  });

  describe('buildEmbersCore', () => {
    it('should minimize bundle size for regtest', async () => {
      const result = await buildEmbersCore('regtest');
      expect(result.size).toBeLessThan(8192); // 8KB limit
      expect(result.gzipSize).toBeLessThan(4096); // 4KB gzipped
    });

    it('should minimize bundle size for signet', async () => {
      const result = await buildEmbersCore('signet');
      expect(result.size).toBeLessThan(8192); // 8KB limit
      expect(result.gzipSize).toBeLessThan(4096); // 4KB gzipped
    });

    it('should generate source maps for debugging', async () => {
      const result = await buildEmbersCore('signet');
      expect(result.sourceMapFile).toBeDefined();
      expect(fs.existsSync(result.sourceMapFile)).toBe(true);
    });

    it('should output network-specific bundle name', async () => {
      const result = await buildEmbersCore('signet');
      expect(result.filename).toContain('embers-core.signet');
      expect(result.filename).toMatch(/embers-core\.signet\.[a-f0-9]{8}\.js$/);
    });

    it('should include version metadata in bundle', async () => {
      const result = await buildEmbersCore('signet');
      const content = fs.readFileSync(result.outputPath, 'utf-8');
      expect(content).toContain('EMBERS_CORE_VERSION');
      expect(content).toContain('EMBERS_CORE_NETWORK');
    });

    it('should validate size budget', async () => {
      const result = await buildEmbersCore('mainnet');
      expect(result.sizeCheck.passed).toBe(true);
      expect(result.sizeCheck.budget).toBe(8192);
      expect(result.sizeCheck.actual).toBeLessThanOrEqual(result.sizeCheck.budget);
    });
  });

  describe('build script integration', () => {
    const scriptPath = path.join(process.cwd(), 'scripts/build-embers-core.cjs');

    it('should have build script', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should accept network parameter', () => {
      const { execSync } = require('child_process');
      const output = execSync('node scripts/build-embers-core.cjs --network signet --dry-run', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      expect(output).toContain('Network: signet');
      expect(output).toContain('Dry run complete');
    });

    it('should report bundle size', () => {
      const { execSync } = require('child_process');
      const output = execSync('node scripts/build-embers-core.cjs --network signet --analyze', { 
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      expect(output).toMatch(/Bundle size: \d+B/);
      expect(output).toMatch(/Gzipped: \d+B/);
    });
  });
});