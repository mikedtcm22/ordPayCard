/**
 * Tests for exported TypeScript interfaces
 * Ensures proper typing for options and results
 */

import { describe, it, expect } from 'vitest';
import type { 
  Network, 
  VerifyPaymentOptions, 
  VerifyPaymentResult,
  DedupeResult,
  BuildInfo 
} from '../index';

describe('Exported Interfaces', () => {
  it('should export VerifyPaymentOptions interface', () => {
    const opts: VerifyPaymentOptions = {
      currentBlock: 100,
      network: 'mainnet' as Network,
      childHeight: 200,
      feeHeight: 199,
      kWindow: 1,
      fetchTx: async () => 'hex'
    };
    
    expect(opts.currentBlock).toBe(100);
    expect(opts.network).toBe('mainnet');
  });

  it('should export VerifyPaymentResult type', () => {
    const result: VerifyPaymentResult = {
      amount: 1000n,
      isValid: true,
      errors: []
    };
    
    expect(result.amount).toBe(1000n);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should export DedupeResult type', () => {
    const result: DedupeResult = {
      original: ['tx1', 'tx2', 'tx1'],
      deduplicated: ['tx1', 'tx2'],
      duplicateCount: 1
    };
    
    expect(result.duplicateCount).toBe(1);
    expect(result.deduplicated).toHaveLength(2);
  });

  it('should export BuildInfo interface', () => {
    const info: BuildInfo = {
      version: '1.0.0',
      timestamp: '2024-01-01T00:00:00Z',
      gitHash: 'abc123'
    };
    
    expect(info.version).toBe('1.0.0');
    expect(info.timestamp).toBeDefined();
    expect(info.gitHash).toBeDefined();
  });

  it('should enforce proper typing on function calls', async () => {
    // Import the actual function to test typing
    const { verifyPayment } = await import('../index');
    
    const opts: VerifyPaymentOptions = {
      currentBlock: 100,
      network: 'testnet' as Network
    };
    
    // This should compile and run
    const result = await verifyPayment('tx', 'addr', 100n, 'nft', opts);
    expect(typeof result).toBe('bigint');
  });

  it('should provide type safety for dedupe function', async () => {
    // Import the actual function
    const { dedupe } = await import('../index');
    
    const input = ['tx1', 'tx2', 'tx1'];
    const result: string[] = dedupe(input);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(['tx1', 'tx2']);
  });
});