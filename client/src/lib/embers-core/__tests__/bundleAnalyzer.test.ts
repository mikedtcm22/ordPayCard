/**
 * Tests for bundle analyzer functionality
 * Ensures we can visualize bundle composition
 */

import { describe, it, expect, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('Bundle Analyzer', () => {
  const projectRoot = path.resolve(__dirname, '../../../../');
  const analyzePath = path.join(projectRoot, 'src/lib/dist/embers-core/stats.html');

  afterAll(() => {
    // Clean up generated stats file after tests
    if (fs.existsSync(analyzePath)) {
      fs.unlinkSync(analyzePath);
    }
  });

  it('should have analyze:embers-core script in package.json', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8')
    );

    expect(packageJson.scripts).toHaveProperty('analyze:embers-core');
  });

  it('should generate a stats.html file when running analyze script', () => {
    // First build the bundle
    execSync('npm run build:embers-core', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Run the analyze script
    execSync('npm run analyze:embers-core', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    // Check that stats.html was created
    expect(fs.existsSync(analyzePath)).toBe(true);
  });

  it('should create a valid HTML visualization file', () => {
    if (!fs.existsSync(analyzePath)) {
      // Run analyze if not already done
      execSync('npm run analyze:embers-core', {
        cwd: projectRoot,
        stdio: 'pipe'
      });
    }

    const statsContent = fs.readFileSync(analyzePath, 'utf-8');

    // Should be valid HTML
    expect(statsContent).toContain('<!DOCTYPE html>');
    expect(statsContent).toContain('<html');
    expect(statsContent).toContain('</html>');

    // Should have visualization-specific content
    expect(statsContent.toLowerCase()).toMatch(/rollup|bundle|module|size/);
  });

  it('should include rollup-plugin-visualizer in build config', () => {
    const viteConfigPath = path.join(projectRoot, 'vite.config.embers.ts');
    const configContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // Should import the visualizer
    expect(configContent).toMatch(/import.*visualizer.*from.*rollup-plugin-visualizer/);
  });

  it('should only generate stats when ANALYZE env var is set', () => {
    const viteConfigPath = path.join(projectRoot, 'vite.config.embers.ts');
    const configContent = fs.readFileSync(viteConfigPath, 'utf-8');

    // Should check for ANALYZE environment variable
    expect(configContent).toMatch(/process\.env\.ANALYZE/);
  });
});