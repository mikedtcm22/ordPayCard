/**
 * Tests for network validation at critical entry points
 * Ensures early detection of network misconfigurations with clear errors
 */

import { validateNetwork } from '../lib/validation/network';
import { verifyPayment } from '../services/registration/parser/verifyPayment';

describe('Network validation', () => {
  describe('validateNetwork', () => {
    it('should reject missing network with clear error', () => {
      expect(() => validateNetwork(undefined)).toThrow(/Missing required network parameter/);
      expect(() => validateNetwork(undefined)).toThrow(/Supported networks: regtest, signet, testnet, mainnet/);
    });

    it('should reject unsupported network with expected vs provided', () => {
      expect(() => validateNetwork('invalidnet')).toThrow(/Unsupported network: invalidnet/);
      expect(() => validateNetwork('invalidnet')).toThrow(/Expected one of: regtest, signet, testnet, mainnet/);
    });

    it('should accept valid networks', () => {
      const validNetworks = ['regtest', 'signet', 'testnet', 'mainnet'];
      validNetworks.forEach(network => {
        expect(() => validateNetwork(network)).not.toThrow();
        expect(validateNetwork(network)).toBe(network);
      });
    });

    it('should provide actionable error message', () => {
      try {
        validateNetwork('bitcoin');
      } catch (error: any) {
        expect(error.message).toContain('Did you mean: mainnet?');
      }
    });
  });

  describe('verifyPayment network validation', () => {
    it('should validate network parameter at entry', async () => {
      const mockTxHex = '01000000000100000000';

      await expect(verifyPayment(
        mockTxHex,
        'creator',
        100n,
        'nftId',
        {
          currentBlock: 100,
          network: undefined as any // Invalid network
        }
      )).rejects.toThrow(/Missing required network parameter/);
    });

    it('should include network context in error messages', async () => {
      const mockTxHex = '01000000000100000000';

      await expect(verifyPayment(
        mockTxHex,
        'creator',
        100n,
        'nftId',
        {
          currentBlock: 100,
          network: 'fakenet' as any
        }
      )).rejects.toThrow(/Unsupported network: fakenet/);
    });
  });
});