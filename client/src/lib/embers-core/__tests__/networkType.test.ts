/**
 * Tests for branded Network type
 * Ensures type safety for network parameters
 */

import { describe, it, expect } from 'vitest';
import { Network, isValidNetwork, verifyPayment } from '../index';
import type { VerifyPaymentOptions } from '../index';

describe('Network Type Safety', () => {
  it('should export Network type', () => {
    // Network should be a branded string type
    const networks: Network[] = ['mainnet', 'testnet', 'signet', 'regtest'];
    expect(networks).toHaveLength(4);
  });

  it('should provide isValidNetwork type guard', () => {
    expect(isValidNetwork('mainnet')).toBe(true);
    expect(isValidNetwork('testnet')).toBe(true);
    expect(isValidNetwork('signet')).toBe(true);
    expect(isValidNetwork('regtest')).toBe(true);
    expect(isValidNetwork('invalid')).toBe(false);
    expect(isValidNetwork('')).toBe(false);
    expect(isValidNetwork(null as any)).toBe(false);
  });

  it('should enforce Network type in verifyPayment options', async () => {
    const validNetwork: Network = 'mainnet';
    const opts: VerifyPaymentOptions = {
      currentBlock: 100,
      network: validNetwork
    };

    // This should compile and run
    const result = await verifyPayment('tx', 'addr', 100n, 'nft', opts);
    expect(result).toBe(0n);
  });

  it('should reject invalid network values at runtime', async () => {
    // Runtime validation should catch invalid networks
    const opts = {
      currentBlock: 100,
      network: 'invalid-network' as any
    };

    await expect(
      verifyPayment('tx', 'addr', 100n, 'nft', opts)
    ).rejects.toThrow('Invalid network');
  });

  it('should provide compile-time type safety', () => {
    // This test verifies that TypeScript enforces the Network type
    // The actual enforcement happens at compile time
    const validNetworks: Network[] = ['mainnet', 'testnet', 'signet', 'regtest'];
    
    validNetworks.forEach(network => {
      expect(isValidNetwork(network)).toBe(true);
    });
  });
});