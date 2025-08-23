/**
 * Server/Client parity tests for EmbersCore
 * Ensures client and server implementations produce identical results
 */

import { describe, it, expect } from 'vitest';
import { 
  verifyPayment as clientVerifyPayment, 
  dedupe as clientDedupe,
  isValidNetwork 
} from '../index';
import { getParityFixtures, type ParityFixture } from '../../../test-fixtures/parity';

describe('Server/Client Parity', () => {
  describe('verifyPayment parity', () => {
    const fixtures = getParityFixtures('verifyPayment');
    
    it.each(fixtures)('should match server result for fixture: $name', async (fixture: ParityFixture) => {
      // Client implementation
      const clientResult = await clientVerifyPayment(
        fixture.input.txHexOrId,
        fixture.input.creatorAddr,
        BigInt(fixture.input.minFee),
        fixture.input.nftId,
        fixture.input.opts
      );
      
      // Compare with expected server result
      expect(clientResult.toString()).toBe(fixture.expected.toString());
    });
  });

  describe('dedupe parity', () => {
    const fixtures = getParityFixtures('dedupe');
    
    it.each(fixtures)('should match server result for fixture: $name', (fixture: ParityFixture) => {
      // Client implementation
      const clientResult = clientDedupe(fixture.input);
      
      // Compare with expected server result
      expect(clientResult).toEqual(fixture.expected);
    });
  });

  describe('network validation parity', () => {
    it('should validate the same networks as server', () => {
      // These should match server validation
      expect(isValidNetwork('mainnet')).toBe(true);
      expect(isValidNetwork('testnet')).toBe(true);
      expect(isValidNetwork('signet')).toBe(true);
      expect(isValidNetwork('regtest')).toBe(true);
      
      // These should be rejected like on server
      expect(isValidNetwork('invalid')).toBe(false);
      expect(isValidNetwork('')).toBe(false);
      expect(isValidNetwork(null)).toBe(false);
      expect(isValidNetwork(undefined)).toBe(false);
    });
  });

  describe('error handling parity', () => {
    it('should throw same error for invalid network', async () => {
      const invalidOpts = {
        currentBlock: 100,
        network: 'invalid-network' as any
      };
      
      await expect(
        clientVerifyPayment('tx', 'addr', 100n, 'nft', invalidOpts)
      ).rejects.toThrow('Invalid network');
    });
  });
});