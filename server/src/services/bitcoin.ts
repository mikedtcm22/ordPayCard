/**
 * Bitcoin Network Service
 *
 * Provides Bitcoin network configuration and basic utilities for interacting
 * with Bitcoin networks (testnet, signet) using bitcoinjs-lib.
 *
 * This service handles:
 * - Network detection and configuration
 * - Network object creation for bitcoinjs-lib
 * - Environment-based network switching
 */

import * as bitcoin from 'bitcoinjs-lib';

export type SupportedNetwork = 'testnet' | 'signet';

/**
 * Network configuration mapping
 */
const NETWORK_CONFIGS = {
  testnet: bitcoin.networks.testnet,
  signet: bitcoin.networks.testnet, // signet uses same params as testnet in bitcoinjs-lib
} as const;

/**
 * Get the current Bitcoin network from environment
 */
export function getCurrentNetwork(): SupportedNetwork {
  const networkEnv = process.env['BITCOIN_NETWORK'] as SupportedNetwork;

  if (!networkEnv || !['testnet', 'signet'].includes(networkEnv)) {
    throw new Error(`Invalid BITCOIN_NETWORK: ${networkEnv}. Must be 'testnet' or 'signet'`);
  }

  return networkEnv;
}

/**
 * Get bitcoinjs-lib Network object for current environment
 */
export function getNetwork(): bitcoin.Network {
  const currentNetwork = getCurrentNetwork();
  return NETWORK_CONFIGS[currentNetwork];
}

/**
 * Get network name for display purposes
 */
export function getNetworkName(): string {
  return getCurrentNetwork();
}

/**
 * Check if current network is testnet
 */
export function isTestnet(): boolean {
  return getCurrentNetwork() === 'testnet';
}

/**
 * Check if current network is signet
 */
export function isSignet(): boolean {
  return getCurrentNetwork() === 'signet';
}

/**
 * Validate that Bitcoin network configuration is properly set
 */
export function validateNetworkConfig(): void {
  try {
    const network = getNetwork();
    const networkName = getNetworkName();

    console.log(`Bitcoin service initialized - Network: ${networkName}`);
    console.log(`Network config:`, {
      messagePrefix: network.messagePrefix,
      bech32: network.bech32,
      pubKeyHash: network.pubKeyHash,
      scriptHash: network.scriptHash,
    });
  } catch (error) {
    throw new Error(
      `Bitcoin network configuration invalid: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
