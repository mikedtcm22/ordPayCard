/**
 * Network validation utilities
 * Ensures network parameters are valid and provides clear error messages
 */

export type BitcoinNetwork = 'regtest' | 'signet' | 'testnet' | 'mainnet';

const SUPPORTED_NETWORKS: BitcoinNetwork[] = ['regtest', 'signet', 'testnet', 'mainnet'];

/**
 * Validates a network parameter and returns it if valid
 * @param network - The network to validate
 * @returns The validated network
 * @throws Error with clear message if network is invalid
 */
export function validateNetwork(network: unknown): BitcoinNetwork {
  // Check for missing network
  if (!network || network === undefined) {
    throw new Error(
      'Missing required network parameter. ' +
      'Supported networks: regtest, signet, testnet, mainnet'
    );
  }

  // Check if network is a string
  if (typeof network !== 'string') {
    throw new Error(
      `Invalid network type: expected string, got ${typeof network}. ` +
      `Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`
    );
  }

  // Check if network is supported
  if (!SUPPORTED_NETWORKS.includes(network as BitcoinNetwork)) {
    let errorMsg = `Unsupported network: ${network}. ` +
                   `Expected one of: ${SUPPORTED_NETWORKS.join(', ')}`;
    
    // Add helpful suggestions for common mistakes
    if (network === 'bitcoin') {
      errorMsg += '. Did you mean: mainnet?';
    } else if (network === 'test') {
      errorMsg += '. Did you mean: testnet?';
    }
    
    throw new Error(errorMsg);
  }

  return network as BitcoinNetwork;
}