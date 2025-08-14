/**
 * Environment Configuration Tests
 *
 * Tests for environment variable validation and configuration
 */

import { getEnvironmentConfig, validateBitcoinNetwork, validateEnvironment } from '../env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return default configuration for development', () => {
      process.env['NODE_ENV'] = 'development';
      process.env['BITCOIN_NETWORK'] = 'testnet';

      const config = getEnvironmentConfig();

      expect(config.NODE_ENV).toBe('development');
      expect(config.BITCOIN_NETWORK).toBe('testnet');
      expect(config.PORT).toBe(3001);
      expect(config.ORDINALS_API_URL).toBe('https://api.hiro.so');
    });

    it('should accept signet network', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';

      const config = getEnvironmentConfig();

      expect(config.BITCOIN_NETWORK).toBe('signet');
    });

    it('should throw error for invalid Bitcoin network', () => {
      process.env['BITCOIN_NETWORK'] = 'mainnet';

      expect(() => getEnvironmentConfig()).toThrow('Invalid BITCOIN_NETWORK: mainnet');
    });

    it('should validate treasury address if provided', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      process.env['TREASURY_ADDRESS'] = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';

      const config = getEnvironmentConfig();

      expect(config.TREASURY_ADDRESS).toBe('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');
    });

    it('should throw error for invalid treasury address', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      process.env['TREASURY_ADDRESS'] = 'invalid-address';

      expect(() => getEnvironmentConfig()).toThrow('Invalid TREASURY_ADDRESS');
    });

    it('should throw error for invalid ordinals API URL', () => {
      process.env['ORDINALS_API_URL'] = 'not-a-url';

      expect(() => getEnvironmentConfig()).toThrow('Invalid ORDINALS_API_URL');
    });

    it('should require JWT_SECRET and TREASURY_ADDRESS in production', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['JWT_SECRET'];
      delete process.env['TREASURY_ADDRESS'];

      expect(() => getEnvironmentConfig()).toThrow('Missing required environment variables');
    });
  });

  describe('validateBitcoinNetwork', () => {
    it('should validate testnet', () => {
      expect(validateBitcoinNetwork('testnet')).toBe(true);
    });

    it('should validate signet', () => {
      expect(validateBitcoinNetwork('signet')).toBe(true);
    });

    it('should reject mainnet', () => {
      expect(validateBitcoinNetwork('mainnet')).toBe(false);
    });

    it('should reject invalid networks', () => {
      expect(validateBitcoinNetwork('invalid')).toBe(false);
      expect(validateBitcoinNetwork('')).toBe(false);
    });
  });

  describe('validateEnvironment', () => {
    it('should pass validation for valid configuration', () => {
      process.env['BITCOIN_NETWORK'] = 'testnet';
      process.env['TREASURY_ADDRESS'] = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';

      // Should not throw
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should fail validation for invalid configuration', () => {
      process.env['BITCOIN_NETWORK'] = 'invalid';

      expect(() => validateEnvironment()).toThrow();
    });
  });
});
