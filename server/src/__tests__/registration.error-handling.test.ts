/**
 * @fileoverview Tests for structured error responses and centralized error handling
 * @module tests/registration.error-handling
 */

import request from 'supertest';
import app from '../index';

describe('Registration API - Structured Error Handling', () => {
  describe('GET /api/registration/:nftId', () => {
    it('should return structured error for invalid inscription format', async () => {
      const res = await request(app).get('/api/registration/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: {
          code: 'INVALID_INSCRIPTION_FORMAT',
          message: 'Invalid inscription ID format',
          statusCode: 400,
        }
      });
    });

    it('should return structured error for network timeout', async () => {
      // Mock a timeout scenario
      const validId = 'a'.repeat(64) + 'i0';
      const originalEnv = process.env['DEBUG'];
      process.env['DEBUG'] = '1'; // Enable debug to see details
      
      // We need to mock fetch to simulate timeout
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('ETIMEDOUT'));
      
      const res = await request(app).get(`/api/registration/${validId}`);
      
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Unable to fetch registration data',
          statusCode: 503,
          details: expect.objectContaining({
            reason: 'Network timeout or service unavailable'
          })
        }
      });
      
      process.env['DEBUG'] = originalEnv;
      global.fetch = originalFetch;
    });

    it('should return structured error for upstream API failures', async () => {
      const validId = 'a'.repeat(64) + 'i0';
      const originalEnv = process.env['DEBUG'];
      process.env['DEBUG'] = '1'; // Enable debug to see details
      
      // Mock upstream API returning error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      });
      
      const res = await request(app).get(`/api/registration/${validId}`);
      
      expect(res.status).toBe(502);
      expect(res.body).toMatchObject({
        error: {
          code: 'UPSTREAM_ERROR',
          message: 'Upstream service error',
          statusCode: 502,
          details: expect.objectContaining({
            upstreamStatus: 500
          })
        }
      });
      
      process.env['DEBUG'] = originalEnv;
      global.fetch = originalFetch;
    });

    it('should return structured error for JSON parsing failures', async () => {
      const validId = 'a'.repeat(64) + 'i0';
      
      // Mock invalid JSON response
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue('{"invalid json')
      });
      
      const res = await request(app).get(`/api/registration/${validId}`);
      
      expect(res.status).toBe(502);
      expect(res.body).toMatchObject({
        error: {
          code: 'DATA_PARSING_ERROR',
          message: 'Failed to parse upstream response',
          statusCode: 502
        }
      });
      
      global.fetch = originalFetch;
    });
  });

  describe('GET /api/registration/status/:inscriptionId', () => {
    it('should return structured error for invalid inscription format', async () => {
      const res = await request(app).get('/api/registration/status/not-valid');
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: {
          code: 'INVALID_INSCRIPTION_FORMAT',
          message: 'Invalid inscription ID format',
          statusCode: 400,
        }
      });
    });

    it('should return structured error for internal server errors', async () => {
      const validId = 'b'.repeat(64) + 'i1';
      
      // Mock an unexpected error - not one we specifically handle
      const originalFetch = global.fetch;
      const originalEnv = process.env['DEBUG'];
      process.env['DEBUG'] = '0'; // Disable debug to ensure no details leak
      
      global.fetch = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected database error');
      });
      
      const res = await request(app).get(`/api/registration/status/${validId}`);
      
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          statusCode: 500
        }
      });
      // Should not expose internal error details in production
      expect(res.body.error.details).toBeUndefined();
      
      process.env['DEBUG'] = originalEnv;
      global.fetch = originalFetch;
    });
  });

  describe('Centralized error handler', () => {
    it('should handle all errors consistently across endpoints', async () => {
      // Test that both endpoints use the same error structure
      const res1 = await request(app).get('/api/registration/bad');
      const res2 = await request(app).get('/api/registration/status/bad');
      
      // Both should have the same error structure
      expect(res1.body).toHaveProperty('error.code');
      expect(res1.body).toHaveProperty('error.message');
      expect(res1.body).toHaveProperty('error.statusCode');
      
      expect(res2.body).toHaveProperty('error.code');
      expect(res2.body).toHaveProperty('error.message'); 
      expect(res2.body).toHaveProperty('error.statusCode');
      
      // Both should use the same error code for invalid format
      expect(res1.body.error.code).toBe('INVALID_INSCRIPTION_FORMAT');
      expect(res2.body.error.code).toBe('INVALID_INSCRIPTION_FORMAT');
    });

    it('should include request ID for tracing in all error responses', async () => {
      const res = await request(app).get('/api/registration/invalid');
      
      expect(res.body).toHaveProperty('error.requestId');
      expect(res.body.error.requestId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should respect debug mode for error details', async () => {
      const validId = 'c'.repeat(64) + 'i0';
      const originalFetch = global.fetch;
      const originalEnv = process.env['DEBUG'];
      
      // Test without debug mode
      process.env['DEBUG'] = '0';
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const res1 = await request(app).get(`/api/registration/${validId}`);
      expect(res1.status).toBe(503);
      expect(res1.body.error).toBeDefined();
      expect(res1.body.error.details).toBeUndefined();
      expect(res1.body.error.stack).toBeUndefined();
      
      // Test with debug mode
      process.env['DEBUG'] = '1';
      const res2 = await request(app).get(`/api/registration/${validId}`);
      expect(res2.status).toBe(503);
      expect(res2.body.error).toBeDefined();
      expect(res2.body.error.details).toBeDefined();
      expect(res2.body.error.stack).toBeDefined();
      
      // Restore
      process.env['DEBUG'] = originalEnv;
      global.fetch = originalFetch;
    });
  });
});