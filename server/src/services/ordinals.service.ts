/**
 * @fileoverview Service layer for ordinals API interactions
 * @module services/ordinals.service
 */

import { ApiError, ErrorCodes } from '../middleware/errorHandler';
import { AppConfig } from '../config';

/**
 * Child inscription data
 */
export interface ChildInscription {
  id: string;
  [key: string]: unknown;
}

/**
 * Service for interacting with ordinals API endpoints
 */
export class OrdinalsService {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Fetch JSON data from an endpoint with error handling
   */
  private async fetchJson(url: string): Promise<unknown | null> {
    try {
      const response = await fetch(url, { redirect: 'follow' });
      
      if (!response.ok) {
        if (response.status >= 500) {
          throw new ApiError(
            502,
            ErrorCodes.UPSTREAM_ERROR,
            'Upstream service error',
            { upstreamStatus: response.status }
          );
        }
        return null;
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new ApiError(
          502,
          ErrorCodes.DATA_PARSING_ERROR,
          'Failed to parse upstream response'
        );
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      
      if (err instanceof Error) {
        if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
          throw new ApiError(
            503,
            ErrorCodes.SERVICE_UNAVAILABLE,
            'Unable to fetch registration data',
            { reason: 'Network timeout or service unavailable' }
          );
        }
      }
      
      throw err;
    }
  }

  /**
   * Fetch inscription metadata
   */
  async fetchMetadata(inscriptionId: string): Promise<unknown | null> {
    const url = `${this.config.registration.endpoints.ordinalsApi}${this.config.registration.endpoints.metadataPath}${inscriptionId}`;
    return this.fetchJson(url);
  }

  /**
   * Fetch transaction data
   */
  async fetchTransaction(txid: string): Promise<unknown | null> {
    const url = `${this.config.registration.endpoints.ordinalsApi}${this.config.registration.endpoints.txPath}${txid}`;
    return this.fetchJson(url);
  }

  /**
   * Fetch inscription content
   */
  async fetchContent(inscriptionId: string): Promise<unknown | null> {
    const url = `${this.config.registration.endpoints.ordinalsApi}${this.config.registration.endpoints.contentPath}${inscriptionId}`;
    return this.fetchJson(url);
  }

  /**
   * Fetch children inscriptions with fallback to different endpoint variants
   */
  async fetchChildren(inscriptionId: string): Promise<ChildInscription[]> {
    const endpoints = this.config.registration.endpoints;
    const variants = [
      `${endpoints.ordinalsApi}${endpoints.childrenPath}${inscriptionId}/inscriptions`,
      `${endpoints.ordinalsApi}${endpoints.childrenPath}${inscriptionId}`,
    ];

    for (const url of variants) {
      const data = await this.fetchJson(url);
      
      if (data && typeof data === 'object') {
        const dataObj = data as Record<string, unknown>;
        
        // Handle 'children' array format
        if (Array.isArray(dataObj['children'])) {
          const children = dataObj['children'] as unknown[];
          return children.map((child: unknown) => {
            if (child && typeof child === 'object') {
              return child as ChildInscription;
            }
            return { id: String(child) };
          });
        }
        
        // Handle 'ids' array format
        if (Array.isArray(dataObj['ids'])) {
          const ids = dataObj['ids'] as string[];
          return ids.map((id: string) => ({ id }));
        }
      }
    }

    return [];
  }
}