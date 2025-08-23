/**
 * Tests for EmbersCore public API surface
 * Ensures all required exports are present with correct types
 */

import { describe, it, expect } from 'vitest';
import * as EmbersCore from '../index';

describe('EmbersCore API Surface', () => {
  it('should export verifyPayment function', () => {
    expect(EmbersCore.verifyPayment).toBeDefined();
    expect(typeof EmbersCore.verifyPayment).toBe('function');
  });

  it('should export dedupe function', () => {
    expect(EmbersCore.dedupe).toBeDefined();
    expect(typeof EmbersCore.dedupe).toBe('function');
  });

  it('should export SEMVER version string', () => {
    expect(EmbersCore.SEMVER).toBeDefined();
    expect(typeof EmbersCore.SEMVER).toBe('string');
    // Version should follow semantic versioning format
    expect(EmbersCore.SEMVER).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should have verifyPayment with correct signature', async () => {
    // Test that verifyPayment accepts the expected parameters
    const mockTxHex = '0x123';
    const mockCreatorAddr = 'bc1qtest';
    const mockMinFee = 1000n;
    const mockNftId = 'inscription123';
    const mockOpts = {
      currentBlock: 100,
      network: 'regtest' as const,
      childHeight: 100,
      feeHeight: 99,
      kWindow: 1,
      fetchTx: async () => 'mockHex'
    };

    // Should return a Promise<bigint>
    const result = EmbersCore.verifyPayment(
      mockTxHex,
      mockCreatorAddr,
      mockMinFee,
      mockNftId,
      mockOpts
    );
    
    expect(result).toBeInstanceOf(Promise);
    // For now, we expect it to resolve to 0n as a minimal implementation
    await expect(result).resolves.toBe(0n);
  });

  it('should have dedupe with correct signature', () => {
    // Test that dedupe accepts an array of strings and returns an array
    const testTxids = ['tx1', 'tx2', 'tx1', 'tx3'];
    const result = EmbersCore.dedupe(testTxids);
    
    expect(Array.isArray(result)).toBe(true);
    // Should preserve order and remove duplicates
    expect(result).toEqual(['tx1', 'tx2', 'tx3']);
  });

  it('should only export documented public API', () => {
    // Ensure we're not accidentally exposing internals
    const publicExports = ['verifyPayment', 'dedupe', 'SEMVER', 'isValidNetwork', 'getBuildInfo'];
    const actualExports = Object.keys(EmbersCore);
    
    expect(actualExports.sort()).toEqual(publicExports.sort());
  });
});