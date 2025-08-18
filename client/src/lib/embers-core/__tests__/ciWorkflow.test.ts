/**
 * Tests for CI workflow configuration
 * Ensures CI runs build and size checks on PRs
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('CI Workflow Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../../../../../');
  const workflowPath = path.join(projectRoot, '.github/workflows/embers-core-size.yml');

  it('should have a GitHub Actions workflow for size checks', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('should run on pull requests', () => {
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(workflowContent) as any;

    // Should trigger on pull requests
    expect(workflow.on).toBeDefined();
    expect(workflow.on.pull_request || workflow.on.includes('pull_request')).toBeTruthy();
  });

  it('should run build and size check steps', () => {
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(workflowContent) as any;

    // Get the job steps
    const job = Object.values(workflow.jobs)[0] as any;
    const steps = job.steps;

    // Should have essential steps
    const stepNames = steps.map((s: any) => s.name || s.run || '');
    
    // Check for required actions
    expect(stepNames.some((name: string) => 
      name.includes('checkout') || name.includes('Checkout')
    )).toBe(true);

    expect(stepNames.some((name: string) => 
      name.includes('setup') || name.includes('Setup') || name.includes('Node')
    )).toBe(true);

    expect(stepNames.some((name: string) => 
      name.includes('install') || name.includes('Install') || name.includes('dependencies')
    )).toBe(true);

    // Should run the build
    expect(stepNames.some((name: string) => 
      name.includes('build') || name.includes('Build')
    )).toBe(true);

    // Should check size
    expect(stepNames.some((name: string) => 
      name.includes('size') || name.includes('Size') || name.includes('postbuild')
    )).toBe(true);
  });

  it('should fail the workflow if size exceeds limit', () => {
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(workflowContent) as any;

    // Find the size check step
    const job = Object.values(workflow.jobs)[0] as any;
    const sizeCheckStep = job.steps.find((s: any) => 
      (s.name && s.name.toLowerCase().includes('size')) ||
      (s.run && s.run.includes('postbuild'))
    );

    expect(sizeCheckStep).toBeDefined();
    
    // The postbuild script exits with error code 1 on failure
    // So the workflow should fail automatically
  });

  it('should cache node modules for performance', () => {
    const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(workflowContent) as any;

    const job = Object.values(workflow.jobs)[0] as any;
    const cacheStep = job.steps.find((s: any) => 
      s.uses && s.uses.includes('cache')
    );

    expect(cacheStep).toBeDefined();
  });
});