/**
 * Ordinals API Client Tests
 *
 * Tests for ordinals API client functionality
 */

import {
  OrdinalsApiClient,
  fetchInscription,
  fetchBlockHeight,
  isValidInscriptionId,
} from '../ordinals';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Ordinals API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('OrdinalsApiClient', () => {
    it('should create client with default configuration', () => {
      const client = new OrdinalsApiClient();
      expect(client).toBeInstanceOf(OrdinalsApiClient);
    });

    it('should create client with custom base URL', () => {
      const customUrl = 'https://custom-api.example.com';
      const client = new OrdinalsApiClient(customUrl);
      expect(client).toBeInstanceOf(OrdinalsApiClient);
    });

    it('should handle successful inscription fetch', async () => {
      const mockInscriptionData = {
        id: 'abc123def456i0',
        number: 12345,
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        output_value: 546,
        content_type: 'text/plain',
        content_length: 13,
        genesis_height: 100000,
        genesis_fee: 1000,
        sat: 1234567890,
        timestamp: 1640995200,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockInscriptionData,
      });

      const client = new OrdinalsApiClient();
      const result = await client.getInscription('abc123def456i0');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInscriptionData);
      expect(result.status).toBe(200);
    });

    it('should handle failed inscription fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const client = new OrdinalsApiClient();
      const result = await client.getInscription('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
      expect(result.status).toBe(404);
    });

    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('AbortError'));

      const client = new OrdinalsApiClient('https://api.example.com', { timeout: 100 });
      const result = await client.getInscription('test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should retry on server errors', async () => {
      // First call fails with 500, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ height: 100000 }),
        });

      const client = new OrdinalsApiClient('https://api.example.com', {
        maxRetries: 2,
        baseDelay: 1, // Very short delay for testing
      });
      const result = await client.getBlockHeight();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      // The second call should succeed
      expect(result.success).toBe(true);
    });

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const client = new OrdinalsApiClient();
      const result = await client.getInscription('invalid');

      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should handle network errors with retry', async () => {
      // First call throws, second succeeds
      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ height: 100000 }),
      });

      const client = new OrdinalsApiClient('https://api.example.com', {
        maxRetries: 2,
        baseDelay: 10,
      });
      const result = await client.getBlockHeight();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ height: 100000, hash: 'abc123' }),
      });

      const client = new OrdinalsApiClient();
      const result = await client.testConnection();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('connected');
    });
  });

  describe('Convenience Functions', () => {
    it('should fetch inscription using convenience function', async () => {
      const mockData = { id: 'test', number: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await fetchInscription('test');
      expect(result.success).toBe(true);
    });

    it('should fetch block height using convenience function', async () => {
      const mockData = { height: 100000, hash: 'abc' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await fetchBlockHeight();
      expect(result.success).toBe(true);
    });
  });

  describe('isValidInscriptionId', () => {
    it('should validate correct inscription IDs', () => {
      const validIds = [
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0',
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890i123',
      ];

      validIds.forEach(id => {
        expect(isValidInscriptionId(id)).toBe(true);
      });
    });

    it('should reject invalid inscription IDs', () => {
      const invalidIds = [
        'invalid',
        'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890', // No 'i'
        'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890iabc', // Non-numeric after 'i'
        'g1b2c3d4e5f6789012345678901234567890123456789012345678901234567890i0', // Invalid hex char 'g'
        'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890xi0', // 'x' instead of 'i'
        '', // Empty string
        'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678901i0', // Too long
        'a1b2c3d4e5f678901234567890123456789012345678901234567890123456789i0', // Too short
      ];

      invalidIds.forEach(id => {
        expect(isValidInscriptionId(id)).toBe(false);
      });
    });
  });
});
