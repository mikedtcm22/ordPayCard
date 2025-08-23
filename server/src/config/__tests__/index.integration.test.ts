/**
 * ConfigManager Network Integration Tests
 * Tests the integration of network-aware configuration into the existing ConfigManager,
 * ensuring backward compatibility and proper network switching.
 */

import { getConfig, resetConfig } from '../index';

describe('ConfigManager network integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clean up environment completely
    for (const key in process.env) {
      if (key.startsWith('BITCOIN_') || key.startsWith('SIGNET_') || 
          key.startsWith('REGTEST_') || key.startsWith('ORD_')) {
        delete process.env[key];
      }
    }
    // Set required env vars
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['DATABASE_URL'] = 'file:./test.db';
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    // Reset the config singleton
    resetConfig();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should switch configurations based on BITCOIN_NETWORK', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['SIGNET_ORD_URL'] = 'http://signet.ord.test:8080';
    process.env['SIGNET_CREATOR_ADDRESS'] = 'tb1qsignetcreator';
    
    resetConfig();
    const config = getConfig();
    
    expect(config.network.bitcoin).toBe('signet');
    expect(config.registration.endpoints.ordinalsApi).toContain('signet.ord.test:8080');
    expect(config.registration.creatorAddress).toBe('tb1qsignetcreator');
  });
  
  it('should maintain backward compatibility with regtest', () => {
    process.env['BITCOIN_NETWORK'] = 'regtest';
    process.env['REGTEST_ORD_URL'] = 'http://localhost:8080';
    process.env['REGTEST_CREATOR_ADDRESS'] = 'bcrt1qregtest';
    
    // Force config re-initialization after setting env vars
    resetConfig();
    const config = getConfig();
    
    expect(config.network.bitcoin).toBe('regtest');
    expect(config.registration.endpoints.ordinalsApi).toBe('http://localhost:8080');
    expect(config.registration.creatorAddress).toBe('bcrt1qregtest');
  });

  it('should default to regtest when BITCOIN_NETWORK is not set', () => {
    delete process.env['BITCOIN_NETWORK'];
    
    resetConfig();
    const config = getConfig();
    
    expect(config.network.bitcoin).toBe('regtest');
  });

  it('should use network-specific ord endpoints', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['SIGNET_ORD_URL'] = 'https://ord.signet.example.com';
    
    resetConfig();
    const config = getConfig();
    
    expect(config.registration.endpoints.metadata).toBe('https://ord.signet.example.com/r/metadata/');
    expect(config.registration.endpoints.children).toBe('https://ord.signet.example.com/r/children/');
    expect(config.registration.endpoints.inscription).toBe('https://ord.signet.example.com/inscription/');
    expect(config.registration.endpoints.content).toBe('https://ord.signet.example.com/content/');
  });

  it('should validate network-specific addresses', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['SIGNET_CREATOR_ADDRESS'] = 'bc1qmainnet'; // Wrong network address
    
    expect(() => {
      resetConfig();
      getConfig();
    }).toThrow('Invalid signet address');
  });

  it('should apply environment variable overrides', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['SIGNET_ORD_URL'] = 'http://localhost:8080';
    process.env['ORD_METADATA_ENDPOINT'] = 'https://custom.metadata.api/';
    
    resetConfig();
    const config = getConfig();
    
    expect(config.registration.endpoints.metadata).toBe('https://custom.metadata.api/');
    expect(config.registration.endpoints.children).toBe('http://localhost:8080/r/children/');
  });

  it('should preserve existing non-network configuration', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['PORT'] = '4000';
    process.env['CORS_ORIGIN'] = 'https://example.com';
    
    resetConfig();
    const config = getConfig();
    
    expect(config.server?.port).toBe(4000);
    expect(config.server?.cors.origin).toBe('https://example.com');
    expect(config.jwt?.secret).toBe('test-secret');
  });

  it('should throw error for unsupported networks', () => {
    process.env['BITCOIN_NETWORK'] = 'mainnet';
    
    expect(() => {
      resetConfig();
      getConfig();
    }).toThrow('Unsupported network: mainnet');
  });
});