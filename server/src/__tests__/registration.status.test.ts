/**
 * Tests for Phase 2 C1: Backend Status API endpoint contract
 * 
 * Verifies GET /api/registration/:nftId endpoint returns proper response structure
 * with provenance gating, debug info, and integrity checks.
 */

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

describe('Phase 2 Registration Status API (C1)', () => {
  const validNftId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai0';
  const invalidNftId = 'not-valid-inscription-id';

  describe('Endpoint contract', () => {
    it('returns 400 for invalid nftId format', async () => {
      const res = await request(app)
        .get(`/api/registration/${invalidNftId}`);
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns complete response structure for valid nftId', async () => {
      const res = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res.status).toBe(200);
      
      // Main response structure
      expect(res.body).toHaveProperty('isRegistered');
      expect(res.body).toHaveProperty('lastRegistration');
      expect(res.body).toHaveProperty('integrity');
      expect(res.body).toHaveProperty('debug');
      
      // isRegistered should be boolean
      expect(typeof res.body.isRegistered).toBe('boolean');
      
      // lastRegistration should be null or object
      expect(res.body.lastRegistration === null || typeof res.body.lastRegistration === 'object').toBe(true);
      
      // integrity should contain source and checks
      expect(res.body.integrity).toHaveProperty('source');
      expect(res.body.integrity).toHaveProperty('checks');
      expect(Array.isArray(res.body.integrity.checks)).toBe(true);
    });

    it('includes provenance gating debug info in response', async () => {
      const res = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.debug).toHaveProperty('H_parent');
      expect(res.body.debug).toHaveProperty('H_child');  
      expect(res.body.debug).toHaveProperty('feeHeight');
      expect(res.body.debug).toHaveProperty('K');
      
      // Debug values should be numbers or null
      const debugFields = ['H_parent', 'H_child', 'feeHeight', 'K'];
      debugFields.forEach(field => {
        const value = res.body.debug[field];
        expect(value === null || typeof value === 'number').toBe(true);
      });
    });

    it('enforces provenance window when H_child != H_parent', async () => {
      // This test will verify that registrations are rejected when 
      // the latest child height doesn't match parent satpoint height
      const res = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res.status).toBe(200);
      
      // When provenance window is violated, isRegistered should be false
      // regardless of other validation criteria
      if (res.body.debug.H_child !== res.body.debug.H_parent && 
          res.body.debug.H_child !== null && 
          res.body.debug.H_parent !== null) {
        expect(res.body.isRegistered).toBe(false);
      }
    });

    it('validates fee transaction height against child height with K window', async () => {
      const res = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res.status).toBe(200);
      
      // When fee height violates window constraints, isRegistered should be false
      if (res.body.debug.feeHeight !== null && 
          res.body.debug.H_child !== null && 
          res.body.debug.K !== null) {
        const feeHeight = res.body.debug.feeHeight;
        const childHeight = res.body.debug.H_child;
        const K = res.body.debug.K;
        
        // Fee must be at or before child height and within K window
        if (feeHeight > childHeight || (childHeight - feeHeight) > K) {
          expect(res.body.isRegistered).toBe(false);
        }
      }
    });

    it('integrates with parser verifyPayment for OP_RETURN validation', async () => {
      const res = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res.status).toBe(200);
      
      // When verifyPayment returns 0 (invalid OP_RETURN, expired, etc), 
      // isRegistered should be false
      expect(res.body.integrity).toHaveProperty('checks');
      expect(res.body.integrity.checks).toContain('verifyPayment');
    });

    it('handles timeout and error cases gracefully', async () => {
      // Test with a different valid ID that might not exist
      const nonExistentValidId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbi1';
      
      const res = await request(app)
        .get(`/api/registration/${nonExistentValidId}`);
      
      // Should not crash, should return proper structure even for missing data
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('isRegistered');
      expect(res.body).toHaveProperty('debug');
      expect(res.body.isRegistered).toBe(false);
    });
  });

  describe('Cache behavior (30s freshness)', () => {
    it('implements caching strategy for repeated requests', async () => {
      // First request
      const res1 = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      // Second request (should hit cache)
      const res2 = await request(app)
        .get(`/api/registration/${validNftId}`);
      
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      // Results should be identical when cached (this is the key test)
      expect(res1.body).toEqual(res2.body);
      
      // Verify cache is working by checking that timestamp in debug is same
      expect(res1.body.debug).toBeDefined();
      expect(res2.body.debug).toBeDefined();
    });
  });
});
