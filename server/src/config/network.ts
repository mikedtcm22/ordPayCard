/**
 * Network Configuration Module
 * Handles loading and validation of Bitcoin network-specific configuration
 * from environment variables, ensuring proper network isolation and address validation.
 */

export type BitcoinNetwork = 'regtest' | 'signet' | 'testnet';

export interface NetworkConfig {
  network: BitcoinNetwork;
  ordUrl: string;
  creatorAddress: string;
}

/**
 * Loads network configuration from environment variables
 * @returns NetworkConfig object with network-specific settings
 * @throws Error if network is unsupported
 */
export function loadNetworkConfig(): NetworkConfig {
  const network = (process.env['BITCOIN_NETWORK'] || 'regtest') as BitcoinNetwork;
  
  // Support regtest, signet, and testnet
  if (network !== 'regtest' && network !== 'signet' && network !== 'testnet') {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  let ordUrl: string;
  let creatorAddress: string;
  
  if (network === 'signet' || network === 'testnet') {
    // Signet and testnet use similar configuration
    ordUrl = process.env['SIGNET_ORD_URL'] || process.env['TESTNET_ORD_URL'] || 'http://localhost:8080';
    creatorAddress = process.env['SIGNET_CREATOR_ADDRESS'] || process.env['TESTNET_CREATOR_ADDRESS'] || '';
  } else {
    // regtest is default
    ordUrl = process.env['REGTEST_ORD_URL'] || 'http://localhost:8080';
    creatorAddress = process.env['REGTEST_CREATOR_ADDRESS'] || '';
  }
  
  return {
    network,
    ordUrl,
    creatorAddress
  };
}

/**
 * Validates network configuration, ensuring addresses match the network
 * @param config - The network configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateNetworkConfig(config: NetworkConfig): void {
  // Simple address prefix validation
  if (config.network === 'signet' || config.network === 'testnet') {
    // Signet and testnet addresses start with 'tb1' (bech32) or '2' (P2SH) or 'm/n' (legacy)
    if (config.creatorAddress.startsWith('bc1') || 
        config.creatorAddress.startsWith('bcrt1') ||
        config.creatorAddress.startsWith('1') ||
        config.creatorAddress.startsWith('3')) {
      throw new Error(`Invalid ${config.network} address`);
    }
  } else if (config.network === 'regtest') {
    // Regtest addresses start with 'bcrt1' (bech32) or '2' (P2SH) or 'm/n' (legacy)
    if (config.creatorAddress.startsWith('bc1') || 
        config.creatorAddress.startsWith('tb1') ||
        config.creatorAddress.startsWith('1') ||
        config.creatorAddress.startsWith('3')) {
      throw new Error('Invalid regtest address');
    }
  }
}