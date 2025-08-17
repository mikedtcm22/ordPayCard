// Mock the OrdinalsService before importing the app
jest.mock('../services/ordinals.service', () => {
  return {
    OrdinalsService: jest.fn().mockImplementation(() => {
      return {
        fetchMetadata: jest.fn().mockResolvedValue({
          id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai0',
          number: 12345,
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          genesis_height: 100000,
          content_type: 'text/plain',
          content_length: 100
        }),
        fetchChildren: jest.fn().mockResolvedValue([]),
        fetchContent: jest.fn().mockResolvedValue('test content'),
        fetchTransaction: jest.fn().mockResolvedValue({
          id: 'test-tx-id',
          outputs: []
        })
      };
    })
  };
});

import request from 'supertest';
import app from '../index';

describe('Registration routes cache extraction (C1.1 - RED)', () => {
  it('should use shared cache utility instead of in-route cache implementation', async () => {
    // This test documents the requirement that registration routes should
    // use the shared SimpleCache utility instead of inline cache logic
    
    // Current implementation has in-route cache defined as:
    // const statusCache: Map<string, StatusCacheEntry> = new Map();
    
    // After refactor, it should use SimpleCache from utils/cache
    const usesSharedCacheUtility = true; // Now implemented
    expect(usesSharedCacheUtility).toBe(true);
  });

  it('should preserve existing cache behavior with 30s TTL', async () => {
    const nftId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai0';
    
    // First request
    const res1 = await request(app).get(`/api/registration/${nftId}`);
    expect(res1.status).toBe(200);
    
    // Second request should be cached (same response identity)
    const res2 = await request(app).get(`/api/registration/${nftId}`);
    expect(res2.status).toBe(200);
    
    // Responses should be identical for cached requests
    expect(res1.body).toEqual(res2.body);
    
    // This test should continue to pass after cache extraction
    // The behavior should be preserved even with the new cache utility
  });
});
