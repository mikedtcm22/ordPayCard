/**
 * @fileoverview Tests for ordinals service layer
 * @module tests/ordinals.service
 */

import { OrdinalsService } from '../services/ordinals.service';
import { AppConfig } from '../config';

describe('Ordinals Service Layer', () => {
  let service: OrdinalsService;
  let mockFetch: jest.Mock;
  let mockConfig: AppConfig;

  beforeEach(() => {
    // Reset fetch mock
    mockFetch = jest.fn();
    global.fetch = mockFetch as any;

    // Create mock config
    mockConfig = {
      registration: {
        endpoints: {
          ordinalsApi: 'http://test.ord.api',
          metadataPath: '/r/metadata/',
          childrenPath: '/r/children/',
          txPath: '/r/tx/',
          contentPath: '/content/'
        },
        timeouts: {
          fetch: 5000,
          cache: 30000
        },
        cache: { ttl: 30000, maxSize: 1000 },
        fees: { registrationSats: 50000, creatorWallet: 'tb1qtest' },
        provenance: { windowK: 1, currentBlockHeight: 1000 }
      },
      network: {
        bitcoin: 'regtest' as const,
        ordinalsApiUrl: 'http://test.ord.api'
      },
      cache: {
        status: { ttl: 30000, maxSize: 1000 },
        metadata: { ttl: 300000, maxSize: 500 },
        children: { ttl: 60000, maxSize: 500 }
      },
      export: () => ({}),
      toJSON: () => '{}'
    };

    service = new OrdinalsService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMetadata', () => {
    it('should fetch inscription metadata from the correct endpoint', async () => {
      const mockMetadata = {
        inscription_id: 'test123i0',
        parent: null,
        created: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockMetadata)
      });

      const result = await service.fetchMetadata('test123i0');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.ord.api/r/metadata/test123i0',
        { redirect: 'follow' }
      );
      expect(result).toEqual(mockMetadata);
    });

    it('should return null for 404 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await service.fetchMetadata('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw ApiError for upstream 5xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502
      });

      await expect(service.fetchMetadata('test')).rejects.toMatchObject({
        statusCode: 502,
        code: 'UPSTREAM_ERROR'
      });
    });

    it('should throw ApiError for network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ETIMEDOUT'));

      await expect(service.fetchMetadata('test')).rejects.toMatchObject({
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch registration data'
      });
    });
  });

  describe('fetchTransaction', () => {
    it('should fetch transaction data from the correct endpoint', async () => {
      const mockTx = {
        txid: 'abc123',
        hex: '0x...',
        block_height: 100
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockTx)
      });

      const result = await service.fetchTransaction('abc123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.ord.api/r/tx/abc123',
        { redirect: 'follow' }
      );
      expect(result).toEqual(mockTx);
    });
  });

  describe('fetchChildren', () => {
    it('should fetch children from inscriptions endpoint variant', async () => {
      const mockChildren = {
        children: [
          { id: 'child1i0' },
          { id: 'child2i0' }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(mockChildren)
        });

      const result = await service.fetchChildren('parent123i0');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.ord.api/r/children/parent123i0/inscriptions',
        { redirect: 'follow' }
      );
      expect(result).toEqual([
        { id: 'child1i0' },
        { id: 'child2i0' }
      ]);
    });

    it('should fallback to regular children endpoint on first failure', async () => {
      const mockChildren = {
        ids: ['child1i0', 'child2i0']
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify(mockChildren)
        });

      const result = await service.fetchChildren('parent123i0');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        'http://test.ord.api/r/children/parent123i0/inscriptions',
        { redirect: 'follow' }
      );
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'http://test.ord.api/r/children/parent123i0',
        { redirect: 'follow' }
      );
      expect(result).toEqual([
        { id: 'child1i0' },
        { id: 'child2i0' }
      ]);
    });

    it('should return empty array when no children found', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: false, status: 404 });

      const result = await service.fetchChildren('lonely123i0');

      expect(result).toEqual([]);
    });
  });

  describe('fetchContent', () => {
    it('should fetch inscription content from the correct endpoint', async () => {
      const mockContent = {
        schema: 'buyer_registration.v1',
        parent: 'parent123i0',
        feeTxid: 'fee123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockContent)
      });

      const result = await service.fetchContent('inscription123i0');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.ord.api/content/inscription123i0',
        { redirect: 'follow' }
      );
      expect(result).toEqual(mockContent);
    });
  });

  describe('error handling consistency', () => {
    it('should handle JSON parsing errors consistently', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'invalid json{'
      });

      await expect(service.fetchMetadata('test')).rejects.toMatchObject({
        statusCode: 502,
        code: 'DATA_PARSING_ERROR'
      });
    });

    it('should handle connection refused errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(service.fetchTransaction('test')).rejects.toMatchObject({
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Unable to fetch registration data'
      });
    });
  });

  describe('configuration usage', () => {
    it('should use configured endpoints', () => {
      const customConfig = {
        ...mockConfig,
        registration: {
          ...mockConfig.registration,
          endpoints: {
            ordinalsApi: 'https://custom.api',
            metadataPath: '/custom/meta/',
            childrenPath: '/custom/children/',
            txPath: '/custom/tx/',
            contentPath: '/custom/content/'
          }
        }
      };

      const customService = new OrdinalsService(customConfig);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => '{}'
      });

      customService.fetchMetadata('test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api/custom/meta/test',
        { redirect: 'follow' }
      );
    });
  });
});