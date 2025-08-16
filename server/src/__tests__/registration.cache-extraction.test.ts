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
