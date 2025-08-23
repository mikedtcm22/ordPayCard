/**
 * Endpoint Resolution Module
 * Maps Bitcoin networks to appropriate ord API endpoints with support
 * for custom URLs and environment variable overrides.
 */

import { BitcoinNetwork } from './network';

export interface OrdEndpoints {
  metadata: string;
  children: string;
  inscription: string;
  content: string;
}

/**
 * Resolves ord API endpoints for a given network and base URL
 * @param network - The Bitcoin network (regtest, signet, testnet)
 * @param baseUrl - The base URL of the ord server
 * @returns Object containing all ord API endpoints
 * @throws Error if network is unsupported
 */
export function getEndpoints(network: BitcoinNetwork, baseUrl: string): OrdEndpoints {
  // Validate network
  if (network !== 'regtest' && network !== 'signet' && network !== 'testnet') {
    throw new Error(`Unsupported network: ${network}`);
  }

  // Normalize base URL - remove trailing slash
  const normalizedBase = baseUrl.replace(/\/$/, '');

  // Build endpoints with environment variable overrides
  const endpoints: OrdEndpoints = {
    metadata: process.env['ORD_METADATA_ENDPOINT'] || `${normalizedBase}/r/metadata/`,
    children: process.env['ORD_CHILDREN_ENDPOINT'] || `${normalizedBase}/r/children/`,
    inscription: process.env['ORD_INSCRIPTION_ENDPOINT'] || `${normalizedBase}/inscription/`,
    content: process.env['ORD_CONTENT_ENDPOINT'] || `${normalizedBase}/content/`
  };

  return endpoints;
}