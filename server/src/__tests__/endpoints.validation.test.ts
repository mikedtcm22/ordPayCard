/**
 * Tests for endpoint validation and per-endpoint timeout enforcement
 * Ensures early detection of misconfigurations and network call resilience
 */

import { validateEndpoints } from '../config/validateEndpoints';
import { withTimeout } from '../lib/network/withTimeout';

describe('Endpoint validation and timeouts', () => {
  describe('validateEndpoints', () => {
    it('should reject invalid base URLs with actionable error', () => {
      const invalidConfigs = [
        { ordinals_api_url: 'not-a-url' },
        { ordinals_api_url: 'ftp://wrong-protocol.com' },
        { ordinals_api_url: 'http://' },
        { ordinals_api_url: 'https://' }
      ];

      invalidConfigs.forEach(config => {
        expect(() => validateEndpoints(config)).toThrow(/Invalid endpoint URL/);
        expect(() => validateEndpoints(config)).toThrow(/Expected format: https:\/\/example\.com/);
      });
    });

    it('should reject empty URLs with missing endpoint error', () => {
      const config = { ordinals_api_url: '' };
      expect(() => validateEndpoints(config)).toThrow(/Missing required endpoint: ordinals_api_url/);
      expect(() => validateEndpoints(config)).toThrow(/Set environment variable: ORDINALS_API_URL/);
    });

    it('should accept valid URLs', () => {
      const validConfigs = [
        { ordinals_api_url: 'https://api.ordinals.com' },
        { ordinals_api_url: 'http://localhost:3000' },
        { ordinals_api_url: 'https://signet.ordinals.com' }
      ];

      validConfigs.forEach(config => {
        expect(() => validateEndpoints(config)).not.toThrow();
      });
    });

    it('should provide clear guidance for missing URLs', () => {
      const config = {};
      expect(() => validateEndpoints(config)).toThrow(/Missing required endpoint: ordinals_api_url/);
      expect(() => validateEndpoints(config)).toThrow(/Set environment variable: ORDINALS_API_URL/);
    });
  });

  describe('withTimeout', () => {
    it('should reject with timeout error when request exceeds timeout', async () => {
      const slowOperation = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 5000);
      });

      await expect(withTimeout(slowOperation(), 100)).rejects.toThrow(/Request timeout after 100ms/);
    });

    it('should resolve when request completes within timeout', async () => {
      const fastOperation = () => Promise.resolve('success');
      
      const result = await withTimeout(fastOperation(), 1000);
      expect(result).toBe('success');
    });

    it('should include endpoint context in timeout error', async () => {
      const slowOperation = () => new Promise((resolve) => {
        setTimeout(() => resolve('success'), 5000);
      });

      await expect(
        withTimeout(slowOperation(), 100, 'https://api.ordinals.com/inscription/abc')
      ).rejects.toThrow(/Endpoint: https:\/\/api\.ordinals\.com\/inscription\/abc/);
    });

    it('should handle already rejected promises', async () => {
      const failedOperation = () => Promise.reject(new Error('Network error'));
      
      await expect(withTimeout(failedOperation(), 1000)).rejects.toThrow('Network error');
    });
  });
});