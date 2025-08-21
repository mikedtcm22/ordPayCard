/**
 * @fileoverview Tests for centralized configuration module
 * @module tests/config
 */

import { getConfig, updateConfig, resetConfig } from '../config';

describe('Centralized Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear test-related env vars
    delete process.env['ORDINALS_API_URL'];
    delete process.env['REGISTRATION_FEE_SATS'];
    delete process.env['CREATOR_WALLET'];
    delete process.env['PROVENANCE_WINDOW_K'];
    delete process.env['CURRENT_BLOCK_HEIGHT'];
    delete process.env['CACHE_TTL_MS'];
    delete process.env['BITCOIN_NETWORK'];
    
    // Reset configuration to defaults before each test
    resetConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Registration configuration', () => {
    it('should provide registration-related configuration', () => {
      const config = getConfig();
      
      expect(config.registration).toBeDefined();
      expect(config.registration).toMatchObject({
        cache: {
          ttl: expect.any(Number),
          maxSize: expect.any(Number)
        },
        endpoints: {
          ordinalsApi: expect.any(String),
          metadataPath: expect.any(String),
          childrenPath: expect.any(String),
          txPath: expect.any(String),
          contentPath: expect.any(String)
        },
        timeouts: {
          fetch: expect.any(Number),
          cache: expect.any(Number)
        },
        fees: {
          registrationSats: expect.any(Number),
          creatorWallet: expect.any(String)
        },
        provenance: {
          windowK: expect.any(Number),
          currentBlockHeight: expect.any(Number)
        }
      });
    });

    it('should use environment variables when available', () => {
      // Set environment variables
      process.env['ORDINALS_API_URL'] = 'https://custom.ord.api';
      process.env['REGISTRATION_FEE_SATS'] = '75000';
      process.env['CREATOR_WALLET'] = 'tb1qcustom';
      process.env['PROVENANCE_WINDOW_K'] = '5';
      process.env['CURRENT_BLOCK_HEIGHT'] = '2000';
      process.env['CACHE_TTL_MS'] = '60000';
      
      // Reset config to pick up new env vars
      resetConfig();
      const config = getConfig();
      
      expect(config.registration.endpoints.ordinalsApi).toBe('https://custom.ord.api');
      expect(config.registration.fees.registrationSats).toBe(75000);
      expect(config.registration.fees.creatorWallet).toBe('tb1qcustom');
      expect(config.registration.provenance.windowK).toBe(5);
      expect(config.registration.provenance.currentBlockHeight).toBe(2000);
      expect(config.registration.cache.ttl).toBe(60000);
    });

    it('should provide sensible defaults when env vars are not set', () => {
      // Clear relevant env vars
      delete process.env['ORDINALS_API_URL'];
      delete process.env['REGISTRATION_FEE_SATS'];
      delete process.env['CACHE_TTL_MS'];
      
      resetConfig();
      const config = getConfig();
      
      expect(config.registration.endpoints.ordinalsApi).toBe('http://localhost:8080');
      expect(config.registration.fees.registrationSats).toBe(50000);
      expect(config.registration.cache.ttl).toBe(30000); // 30 seconds default
    });

    it('should allow runtime configuration updates', () => {
      const config = getConfig();
      const originalFees = config.registration.fees.registrationSats;
      
      updateConfig({
        registration: {
          cache: {
            ttl: 120000, // 2 minutes
            maxSize: 100
          }
        }
      });
      
      const updatedConfig = getConfig();
      expect(updatedConfig.registration.cache.ttl).toBe(120000);
      
      // Other values should remain unchanged
      expect(updatedConfig.registration.fees.registrationSats).toBe(originalFees);
    });
  });

  describe('Network configuration', () => {
    it('should provide network-specific configuration', () => {
      const config = getConfig();
      
      expect(config.network).toBeDefined();
      expect(config.network).toMatchObject({
        bitcoin: expect.stringMatching(/^(mainnet|testnet|signet|regtest)$/),
        ordinalsApiUrl: expect.any(String)
      });
    });

    it('should adjust endpoints based on Bitcoin network', () => {
      process.env['BITCOIN_NETWORK'] = 'signet';
      resetConfig();
      
      const signetConfig = getConfig();
      expect(signetConfig.network.bitcoin).toBe('signet');
      
      process.env['BITCOIN_NETWORK'] = 'regtest';
      resetConfig();
      
      const regtestConfig = getConfig();
      expect(regtestConfig.network.bitcoin).toBe('regtest');
    });
  });

  describe('Cache configuration', () => {
    it('should provide cache-specific configuration per type', () => {
      const config = getConfig();
      
      expect(config.cache).toBeDefined();
      expect(config.cache).toMatchObject({
        status: {
          ttl: expect.any(Number),
          maxSize: expect.any(Number)
        },
        metadata: {
          ttl: expect.any(Number),
          maxSize: expect.any(Number)
        },
        children: {
          ttl: expect.any(Number),
          maxSize: expect.any(Number)
        }
      });
    });

    it('should allow different TTLs for different cache types', () => {
      updateConfig({
        cache: {
          status: { ttl: 30000, maxSize: 100 },    // 30 seconds
          metadata: { ttl: 300000, maxSize: 100 },  // 5 minutes
          children: { ttl: 60000, maxSize: 100 }    // 1 minute
        }
      });
      
      const config = getConfig();
      expect(config.cache.status.ttl).toBe(30000);
      expect(config.cache.metadata.ttl).toBe(300000);
      expect(config.cache.children.ttl).toBe(60000);
    });
  });

  describe('Configuration validation', () => {
    it('should validate configuration values', () => {
      expect(() => {
        updateConfig({
          registration: {
            cache: {
              ttl: -1000, // Invalid negative TTL
              maxSize: 100
            }
          }
        });
      }).toThrow('Invalid cache TTL: must be positive');
      
      expect(() => {
        updateConfig({
          registration: {
            fees: {
              registrationSats: 0, // Invalid zero fee
              creatorWallet: 'bc1test'
            }
          }
        });
      }).toThrow('Invalid registration fee: must be positive');
    });

    it('should validate Bitcoin network values', () => {
      process.env['BITCOIN_NETWORK'] = 'invalid-network';
      
      expect(() => {
        resetConfig();
      }).toThrow('Unsupported network: invalid-network');
    });
  });

  describe('Configuration export', () => {
    it('should export configuration in a format suitable for logging', () => {
      const config = getConfig();
      const exported = config.export();
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('object');
      
      // Should not include sensitive data in export
      expect(exported).not.toHaveProperty('fees.creatorWallet');
      
      // Should include non-sensitive config
      expect(exported).toHaveProperty('registration.cache.ttl');
      expect(exported).toHaveProperty('network.bitcoin');
    });

    it('should provide a method to get all configuration as JSON', () => {
      const config = getConfig();
      const json = config.toJSON();
      
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('registration');
      expect(parsed).toHaveProperty('network');
      expect(parsed).toHaveProperty('cache');
    });
  });
});