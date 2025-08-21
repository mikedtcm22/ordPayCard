/**
 * Network Configuration Tests
 * Tests the loading and validation of network-specific Bitcoin configuration
 * from environment variables, ensuring proper address validation per network.
 */

import { loadNetworkConfig, validateNetworkConfig, type NetworkConfig } from '../network';

describe('Network configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load Signet configuration from environment', () => {
    process.env['BITCOIN_NETWORK'] = 'signet';
    process.env['SIGNET_ORD_URL'] = 'http://localhost:8080';
    process.env['SIGNET_CREATOR_ADDRESS'] = 'tb1qtest123';
    
    const config = loadNetworkConfig();
    
    expect(config.network).toBe('signet');
    expect(config.ordUrl).toBe('http://localhost:8080');
    expect(config.creatorAddress).toBe('tb1qtest123');
  });
  
  it('should validate Signet addresses', () => {
    const config: NetworkConfig = { 
      network: 'signet', 
      creatorAddress: 'bc1qmainnet', // mainnet address on signet
      ordUrl: 'http://localhost:8080'
    };
    
    expect(() => validateNetworkConfig(config)).toThrow('Invalid Signet address');
  });

  it('should load regtest configuration for backward compatibility', () => {
    process.env['BITCOIN_NETWORK'] = 'regtest';
    process.env['REGTEST_ORD_URL'] = 'http://localhost:8080';
    process.env['REGTEST_CREATOR_ADDRESS'] = 'bcrt1qregtest';
    
    const config = loadNetworkConfig();
    
    expect(config.network).toBe('regtest');
    expect(config.ordUrl).toBe('http://localhost:8080');
    expect(config.creatorAddress).toBe('bcrt1qregtest');
  });

  it('should validate regtest addresses', () => {
    const config: NetworkConfig = { 
      network: 'regtest', 
      creatorAddress: 'tb1qsignet', // signet address on regtest
      ordUrl: 'http://localhost:8080'
    };
    
    expect(() => validateNetworkConfig(config)).toThrow('Invalid regtest address');
  });

  it('should default to regtest when BITCOIN_NETWORK is not set', () => {
    delete process.env['BITCOIN_NETWORK'];
    
    const config = loadNetworkConfig();
    
    expect(config.network).toBe('regtest');
  });

  it('should throw error for unsupported network', () => {
    process.env['BITCOIN_NETWORK'] = 'mainnet';
    
    expect(() => loadNetworkConfig()).toThrow('Unsupported network: mainnet');
  });
});