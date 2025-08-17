/**
 * @fileoverview Tests for lightweight metrics hooks (request timing, cache hit ratio)
 * @module tests/registration.metrics
 */

import request from 'supertest';
import express from 'express';
import { createRegistrationRouter, MetricsFunctions } from '../routes/registration';

describe('Registration API - Metrics Hooks', () => {
  const validNftId = 'a'.repeat(64) + 'i0';
  let testApp: express.Application;
  let testMetrics: any;
  
  beforeEach(() => {
    // Set up required environment variables for the route
    process.env['CREATOR_WALLET'] = 'tb1qtest';
    process.env['REGISTRATION_FEE_SATS'] = '50000';
    process.env['PROVENANCE_WINDOW_K'] = '1';
    process.env['CURRENT_BLOCK_HEIGHT'] = '1000';
    
    // Create a fresh metrics collector for each test
    const MetricsCollector = require('../utils/metrics').MetricsCollector;
    
    // Create test-specific metrics instance
    const metricsCollector = new MetricsCollector();
    testMetrics = {
      resetMetrics: () => metricsCollector.resetMetrics(),
      recordRequest: (endpoint: string, duration: number) => metricsCollector.recordRequest(endpoint, duration),
      recordCacheOperation: (hit: boolean, key: string) => metricsCollector.recordCacheOperation(hit, key),
      getMetrics: () => metricsCollector.getMetrics(),
      exportMetrics: () => metricsCollector.exportMetrics(),
      registerHook: (event: string, callback: any) => metricsCollector.registerHook(event, callback),
      triggerHook: (event: string, data: any) => metricsCollector.triggerHook(event, data),
      getApiMetrics: () => metricsCollector.getApiMetrics()
    };
    
    // Create test app with injected metrics
    testApp = express();
    testApp.use(express.json() as any);
    
    // Add request ID middleware (required by error handler)
    testApp.use((req: any, _res, next) => {
      req.id = 'test-request-id';
      next();
    });
    
    const router = createRegistrationRouter(testMetrics as MetricsFunctions);
    testApp.use('/api/registration', router);
    
    // Add metrics endpoint for testing
    testApp.get('/api/metrics', (_req, res) => {
      res.json(testMetrics.getApiMetrics());
    });
    
    // Add error handler middleware (required for proper error responses)
    const { errorHandler } = require('../middleware/errorHandler');
    testApp.use(errorHandler);
    
    // Mock fetch for ord API calls
    global.fetch = jest.fn().mockImplementation((url: string) => {
      // Mock successful responses for ord API
      if (url.includes('/r/metadata/')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ 
            genesis_height: 100,
            genesis_fee: 1000
          }))
        });
      }
      if (url.includes('/r/children/')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ 
            children: []
          }))
        });
      }
      if (url.includes('/r/tx/')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ 
            hex: '010000000100000000000000000000000000000000',
            block_height: 100
          }))
        });
      }
      // Default response
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('{}')
      });
    });
  });
  
  afterEach(() => {
    // Restore fetch
    jest.restoreAllMocks();
  });

  describe('Request timing metrics', () => {
    it('should capture request duration for successful requests', async () => {
      // Make a request
      await request(testApp).get(`/api/registration/${validNftId}`);
      
      // Get metrics
      const metrics = testMetrics.getMetrics();
      
      expect(metrics).toHaveProperty('requests');
      expect(metrics.requests).toHaveProperty('/api/registration/:nftId');
      expect(metrics.requests['/api/registration/:nftId']).toMatchObject({
        count: 1,
        totalDuration: expect.any(Number),
        averageDuration: expect.any(Number),
        minDuration: expect.any(Number),
        maxDuration: expect.any(Number)
      });
      
      // Duration should be reasonable (> 0ms, < 5000ms)
      expect(metrics.requests['/api/registration/:nftId'].averageDuration).toBeGreaterThan(0);
      expect(metrics.requests['/api/registration/:nftId'].averageDuration).toBeLessThan(5000);
    });

    it('should capture request duration for error responses', async () => {
      // Make a request with invalid ID
      await request(testApp).get('/api/registration/invalid-id');
      
      // Get metrics
      const metrics = testMetrics.getMetrics();
      
      expect(metrics.requests['/api/registration/:nftId'].count).toBe(1);
      expect(metrics.requests['/api/registration/:nftId'].totalDuration).toBeGreaterThan(0);
    });

    it('should track multiple requests and calculate averages correctly', async () => {
      // Make multiple requests
      await request(testApp).get(`/api/registration/${validNftId}`);
      await request(testApp).get(`/api/registration/${validNftId}`);
      await request(testApp).get(`/api/registration/${validNftId}`);
      
      const metrics = testMetrics.getMetrics();
      
      expect(metrics.requests['/api/registration/:nftId'].count).toBe(3);
      expect(metrics.requests['/api/registration/:nftId'].averageDuration).toBe(
        metrics.requests['/api/registration/:nftId'].totalDuration / 3
      );
    });
  });

  describe('Cache hit ratio metrics', () => {
    it('should track cache hits and misses', async () => {
      const uniqueId = 'f'.repeat(64) + 'i0'; // Use unique ID for this test
      
      // First request - cache miss
      await request(testApp).get(`/api/registration/${uniqueId}`);
      
      // Second request - cache hit
      await request(testApp).get(`/api/registration/${uniqueId}`);
      
      // Third request - cache hit
      await request(testApp).get(`/api/registration/${uniqueId}`);
      
      const metrics = testMetrics.getMetrics();
      
      expect(metrics).toHaveProperty('cache');
      expect(metrics.cache).toMatchObject({
        hits: 2,
        misses: 1,
        hitRatio: 2/3,
        totalRequests: 3
      });
    });

    it('should handle cache misses correctly', async () => {
      // Different IDs = all cache misses
      const id1 = 'b'.repeat(64) + 'i0';
      const id2 = 'c'.repeat(64) + 'i0';
      const id3 = 'd'.repeat(64) + 'i0';
      
      await request(testApp).get(`/api/registration/${id1}`);
      await request(testApp).get(`/api/registration/${id2}`);
      await request(testApp).get(`/api/registration/${id3}`);
      
      const metrics = testMetrics.getMetrics();
      
      expect(metrics.cache).toMatchObject({
        hits: 0,
        misses: 3,
        hitRatio: 0,
        totalRequests: 3
      });
    });

    it('should calculate hit ratio as percentage correctly', async () => {
      const id1 = 'e'.repeat(64) + 'i0'; // Valid hex IDs for this test
      const id2 = 'f'.repeat(64) + 'i0';
      
      // Mix of hits and misses
      await request(testApp).get(`/api/registration/${id1}`); // miss
      await request(testApp).get(`/api/registration/${id1}`); // hit
      await request(testApp).get(`/api/registration/${id1}`); // hit
      await request(testApp).get(`/api/registration/${id2}`); // miss
      await request(testApp).get(`/api/registration/${id2}`); // hit
      
      const metrics = testMetrics.getMetrics();
      
      // Now we have full control over metrics state
      expect(metrics.cache.hits).toBe(3);
      expect(metrics.cache.misses).toBe(2);
      expect(metrics.cache.hitRatio).toBeCloseTo(0.6, 2); // 3/5 = 0.6
    });
  });

  describe('Metrics export and observability', () => {
    it('should expose metrics in a format suitable for monitoring', async () => {
      // Generate some activity
      await request(testApp).get(`/api/registration/${validNftId}`);
      await request(testApp).get(`/api/registration/${validNftId}`);
      
      const exportedMetrics = testMetrics.exportMetrics();
      
      // Should be in a standard format (e.g., Prometheus-style or JSON)
      expect(exportedMetrics).toBeDefined();
      expect(typeof exportedMetrics).toBe('object');
      
      // Should include timestamp
      expect(exportedMetrics).toHaveProperty('timestamp');
      expect(new Date(exportedMetrics.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
      
      // Should include labeled metrics
      expect(exportedMetrics).toHaveProperty('metrics');
      expect(Array.isArray(exportedMetrics.metrics)).toBe(true);
      
      // Check for specific metric entries
      const requestMetric = exportedMetrics.metrics.find(
        (m: any) => m.name === 'http_request_duration_ms'
      );
      expect(requestMetric).toBeDefined();
      expect(requestMetric).toHaveProperty('labels');
      expect(requestMetric.labels).toHaveProperty('endpoint', '/api/registration/:nftId');
      
      const cacheMetric = exportedMetrics.metrics.find(
        (m: any) => m.name === 'cache_hit_ratio'
      );
      expect(cacheMetric).toBeDefined();
      expect(cacheMetric).toHaveProperty('value');
      expect(cacheMetric.value).toBeGreaterThanOrEqual(0);
      expect(cacheMetric.value).toBeLessThanOrEqual(1);
    });

    it('should provide metrics endpoint for monitoring systems', async () => {
      // Generate some activity first
      await request(testApp).get(`/api/registration/${validNftId}`);
      
      // Request metrics endpoint
      const res = await request(testApp).get('/api/metrics');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('metrics');
      expect(res.body.metrics).toHaveProperty('requests');
      expect(res.body.metrics).toHaveProperty('cache');
    });
  });

  describe('Metrics hooks integration', () => {
    it('should allow custom metrics collectors via hooks', async () => {
      // Register a custom hook
      const customMetrics: any[] = [];
      testMetrics.registerHook('beforeRequest', (data: any) => {
        customMetrics.push({ type: 'before', ...data });
      });
      
      testMetrics.registerHook('afterRequest', (data: any) => {
        customMetrics.push({ type: 'after', ...data });
      });
      
      // Make a request
      await request(testApp).get(`/api/registration/${validNftId}`);
      
      // Check that hooks were called
      expect(customMetrics).toHaveLength(2);
      expect(customMetrics[0]).toMatchObject({
        type: 'before',
        endpoint: '/api/registration/:nftId',
        method: 'GET'
      });
      expect(customMetrics[1]).toMatchObject({
        type: 'after',
        endpoint: '/api/registration/:nftId',
        method: 'GET',
        statusCode: 200,
        duration: expect.any(Number)
      });
    });

    it('should track cache operations via hooks', async () => {
      const uniqueId = 'a1b2c3d4'.repeat(8) + 'i0'; // Valid hex ID for this test
      
      const cacheEvents: any[] = [];
      testMetrics.registerHook('cacheOperation', (data: any) => {
        cacheEvents.push(data);
      });
      
      // First request - should trigger cache miss
      await request(testApp).get(`/api/registration/${uniqueId}`);
      
      // Second request - should trigger cache hit
      await request(testApp).get(`/api/registration/${uniqueId}`);
      
      // With dependency injection, we have full control
      expect(cacheEvents).toHaveLength(2);
      expect(cacheEvents[0]).toMatchObject({
        operation: 'get',
        hit: false,
        key: uniqueId
      });
      expect(cacheEvents[1]).toMatchObject({
        operation: 'get',
        hit: true,
        key: uniqueId
      });
    });
  });
});