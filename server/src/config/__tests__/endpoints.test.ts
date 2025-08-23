/**
 * Endpoint Resolution Tests
 * Tests the dynamic resolution of ord API endpoints based on network configuration,
 * ensuring correct URL construction and support for custom endpoints.
 */

import { getEndpoints } from '../endpoints';

describe('Endpoint resolution', () => {
  it('should return Signet endpoints for Signet network', () => {
    const endpoints = getEndpoints('signet', 'http://localhost:8080');
    
    expect(endpoints.metadata).toBe('http://localhost:8080/r/metadata/');
    expect(endpoints.children).toBe('http://localhost:8080/r/children/');
    expect(endpoints.inscription).toBe('http://localhost:8080/inscription/');
    expect(endpoints.content).toBe('http://localhost:8080/content/');
  });
  
  it('should support custom ord URLs per network', () => {
    const endpoints = getEndpoints('signet', 'https://ord.signet.example.com');
    
    expect(endpoints.metadata).toContain('ord.signet.example.com');
    expect(endpoints.metadata).toBe('https://ord.signet.example.com/r/metadata/');
    expect(endpoints.children).toBe('https://ord.signet.example.com/r/children/');
  });

  it('should handle trailing slashes consistently', () => {
    const endpointsWithSlash = getEndpoints('signet', 'http://localhost:8080/');
    const endpointsWithoutSlash = getEndpoints('signet', 'http://localhost:8080');
    
    expect(endpointsWithSlash.metadata).toBe(endpointsWithoutSlash.metadata);
    expect(endpointsWithSlash.children).toBe(endpointsWithoutSlash.children);
  });

  it('should return regtest endpoints for regtest network', () => {
    const endpoints = getEndpoints('regtest', 'http://localhost:8080');
    
    expect(endpoints.metadata).toBe('http://localhost:8080/r/metadata/');
    expect(endpoints.children).toBe('http://localhost:8080/r/children/');
    expect(endpoints.inscription).toBe('http://localhost:8080/inscription/');
    expect(endpoints.content).toBe('http://localhost:8080/content/');
  });

  it('should preserve protocol in custom URLs', () => {
    const httpsEndpoints = getEndpoints('signet', 'https://secure.ord.com');
    const httpEndpoints = getEndpoints('signet', 'http://insecure.ord.com');
    
    expect(httpsEndpoints.metadata).toMatch(/^https:/);
    expect(httpEndpoints.metadata).toMatch(/^http:/);
  });

  it('should handle port numbers in base URL', () => {
    const endpoints = getEndpoints('signet', 'http://localhost:3333');
    
    expect(endpoints.metadata).toBe('http://localhost:3333/r/metadata/');
    expect(endpoints.children).toBe('http://localhost:3333/r/children/');
  });

  it('should support environment variable overrides', () => {
    process.env['ORD_METADATA_ENDPOINT'] = 'https://custom.metadata.api/';
    
    const endpoints = getEndpoints('signet', 'http://localhost:8080');
    
    expect(endpoints.metadata).toBe('https://custom.metadata.api/');
    expect(endpoints.children).toBe('http://localhost:8080/r/children/'); // Not overridden
    
    delete process.env['ORD_METADATA_ENDPOINT'];
  });

  it('should throw error for invalid network', () => {
    // @ts-expect-error Testing invalid network
    expect(() => getEndpoints('mainnet', 'http://localhost:8080')).toThrow('Unsupported network: mainnet');
  });
});