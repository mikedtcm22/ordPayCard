/**
 * Bitcoin Service Tests
 *
 * Tests for Bitcoin network configuration and utilities
 */

import * as bitcoin from 'bitcoinjs-lib';
import {
  getCurrentNetwork,
  getNetwork,
  getNetworkName,
  isTestnet,
  isSignet,
  validateNetworkConfig,
} from '../bitcoin';

describe('Bitcoin Service', () => {
  const originalEnv = process.env['BITCOIN_NETWORK'];

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env['BITCOIN_NETWORK'] = originalEnv;
    } else {
      delete process.env['BITCOIN_NETWORK'];
    }
  });

  describe('getCurrentNetwork', () => {
    it('should return testnet when BITCOIN_NETWORK is testnet', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      expect(getCurrentNetwork()).toBe('testnet');
    });

    it('should return signet when BITCOIN_NETWORK is signet', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      expect(getCurrentNetwork()).toBe('signet');
    });

    it('should throw error when BITCOIN_NETWORK is invalid', () => {
      process.env['BITCOIN_NETWORK'] = 'mainnet';
      expect(() => getCurrentNetwork()).toThrow('Invalid BITCOIN_NETWORK: mainnet');
    });

    it('should throw error when BITCOIN_NETWORK is undefined', () => {
      delete process.env['BITCOIN_NETWORK'];
      expect(() => getCurrentNetwork()).toThrow('Invalid BITCOIN_NETWORK: undefined');
    });
  });

  describe('getNetwork', () => {
    it('should return testnet network config for testnet', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      const network = getNetwork();
      expect(network).toBe(bitcoin.networks.testnet);
      expect(network.bech32).toBe('tb');
    });

    it('should return testnet network config for signet', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      const network = getNetwork();
      expect(network).toBe(bitcoin.networks.testnet);
      expect(network.bech32).toBe('tb');
    });
  });

  describe('getNetworkName', () => {
    it('should return correct network name for testnet', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      expect(getNetworkName()).toBe('testnet');
    });

    it('should return correct network name for signet', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      expect(getNetworkName()).toBe('signet');
    });
  });

  describe('isTestnet', () => {
    it('should return true when network is testnet', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      expect(isTestnet()).toBe(true);
    });

    it('should return false when network is signet', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      expect(isTestnet()).toBe(false);
    });
  });

  describe('isSignet', () => {
    it('should return true when network is signet', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      expect(isSignet()).toBe(true);
    });

    it('should return false when network is testnet', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      expect(isSignet()).toBe(false);
    });
  });

  describe('validateNetworkConfig', () => {
    it('should not throw for valid testnet config', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      expect(() => validateNetworkConfig()).not.toThrow();
    });

    it('should not throw for valid signet config', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      expect(() => validateNetworkConfig()).not.toThrow();
    });

    it('should throw for invalid network config', () => {
      process.env['BITCOIN_NETWORK'] = 'invalid';
      expect(() => validateNetworkConfig()).toThrow('Bitcoin network configuration invalid');
    });
  });
});
