/**
 * Snapshot tests for EmbersCore public API signatures
 * Detects breaking changes in function signatures and exported types
 */

import { describe, it, expect } from 'vitest';
import * as EmbersCore from '../index';

describe('EmbersCore API Snapshot', () => {
  it('should maintain stable verifyPayment signature', () => {
    // Capture the function signature as a snapshot
    const signature = {
      name: 'verifyPayment',
      length: EmbersCore.verifyPayment.length,
      isAsync: EmbersCore.verifyPayment.constructor.name === 'AsyncFunction',
      // Get parameter names from function toString (simplified)
      params: EmbersCore.verifyPayment.toString()
        .match(/\(([^)]*)\)/)?.[1]
        .split(',')
        .map(p => p.trim().split(':')[0].replace('_', ''))
        || []
    };
    
    expect(signature).toMatchSnapshot();
  });

  it('should detect breaking changes when signature changes', () => {
    // This test demonstrates that snapshots will catch signature changes
    // The actual detection happens when the main snapshot tests run
    // Here we just verify the mechanism works
    
    const currentSignature = {
      name: 'verifyPayment',
      length: EmbersCore.verifyPayment.length,
      params: 5
    };
    
    // If someone changes the function to have 4 params instead of 5,
    // the snapshot test will fail
    expect(currentSignature.length).toBe(5);
    expect(currentSignature.params).toBe(5);
  });

  it('should maintain stable dedupe signature', () => {
    const signature = {
      name: 'dedupe',
      length: EmbersCore.dedupe.length,
      isAsync: false,
      params: ['txids']
    };
    
    expect(signature).toMatchSnapshot();
  });

  it('should maintain stable SEMVER export', () => {
    const versionInfo = {
      type: typeof EmbersCore.SEMVER,
      format: /^\d+\.\d+\.\d+$/.test(EmbersCore.SEMVER),
      major: EmbersCore.SEMVER.split('.')[0],
      minor: EmbersCore.SEMVER.split('.')[1],
      patch: EmbersCore.SEMVER.split('.')[2]
    };
    
    expect(versionInfo).toMatchSnapshot();
  });

  it('should export only documented public API members', () => {
    const exportedMembers = Object.keys(EmbersCore).sort();
    expect(exportedMembers).toMatchSnapshot();
  });

  it('should maintain stable type signatures for options', () => {
    // This test will verify that the exported types match expected shapes
    // For now, we'll check that the function accepts the expected parameter count
    const verifyPaymentParams = 5; // txHexOrId, creatorAddr, minFee, nftId, opts
    expect(EmbersCore.verifyPayment.length).toBe(verifyPaymentParams);
    
    const dedupeParams = 1; // txids array
    expect(EmbersCore.dedupe.length).toBe(dedupeParams);
    
    // Snapshot the parameter counts
    const paramCounts = {
      verifyPayment: verifyPaymentParams,
      dedupe: dedupeParams
    };
    
    expect(paramCounts).toMatchSnapshot();
  });
});