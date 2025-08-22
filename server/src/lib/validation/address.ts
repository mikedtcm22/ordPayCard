/**
 * Bitcoin address validation with full checksum verification
 * Uses bitcoinjs-lib for robust address validation across networks
 */

import * as bitcoin from 'bitcoinjs-lib';
import type { BitcoinNetwork } from './network';

/**
 * Get bitcoinjs-lib network object for a given network name
 */
function getNetwork(network: BitcoinNetwork): bitcoin.Network {
  switch (network) {
    case 'mainnet':
      return bitcoin.networks.bitcoin;
    case 'testnet':
      return bitcoin.networks.testnet;
    case 'signet':
      // Signet uses same address format as testnet
      return bitcoin.networks.testnet;
    case 'regtest':
      return bitcoin.networks.regtest;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Validates a Bitcoin address for a specific network
 * @param address - The address to validate
 * @param network - The network to validate against
 * @returns true if valid
 * @throws Error with specific reason if invalid
 */
export function validateAddress(address: string, network: BitcoinNetwork): boolean {
  try {
    const bitcoinNetwork = getNetwork(network);
    
    // Try to decode the address - this will throw if invalid
    bitcoin.address.toOutputScript(address, bitcoinNetwork);
    
    // If we get here, the address is valid for this network
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '';
    
    // Check for invalid prefix (wrong network)
    if (errorMsg.includes('invalid prefix')) {
      // Try to determine which network it's valid for
      const networks = ['mainnet', 'testnet', 'signet', 'regtest'] as BitcoinNetwork[];
      for (const testNetwork of networks) {
        if (testNetwork === network) continue;
        try {
          bitcoin.address.toOutputScript(address, getNetwork(testNetwork));
          // If we get here, it's valid for another network
          throw new Error(
            `Address network mismatch. ` +
            `Address appears to be for ${testNetwork}, but expected ${network}`
          );
        } catch (testError: unknown) {
          // Continue checking other networks
          if (testError instanceof Error && testError.message?.includes('Address network mismatch')) {
            throw testError;
          }
        }
      }
    }
    
    // Check for invalid format/checksum
    if (errorMsg.includes('no matching Script') || 
        errorMsg.includes('Invalid') ||
        errorMsg.includes('checksum')) {
      throw new Error(
        `Invalid address checksum. ` +
        `Network: ${network}. ` +
        `Ensure the address is correctly formatted and has a valid checksum`
      );
    }

    // Generic invalid address error
    throw new Error(
      `Invalid Bitcoin address format. ` +
      `Expected format examples: ` +
      `${network === 'mainnet' ? 'bc1q..., 1..., 3...' : 
        network === 'regtest' ? 'bcrt1q..., m..., n...' :
        'tb1q..., m..., n...'}`
    );
  }
}