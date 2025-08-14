/**
 * Bitcoin Address Validation Utilities
 *
 * Provides functions for validating Bitcoin addresses across different
 * networks (testnet, signet) and address types (p2wpkh, p2tr, etc.)
 *
 * This module handles:
 * - Address format validation
 * - Network-specific address validation
 * - Address type detection
 * - Bech32 checksum validation
 */

import * as bitcoin from 'bitcoinjs-lib';
import { getNetwork } from '../services/bitcoin';

export type AddressType = 'p2wpkh' | 'p2tr' | 'p2sh' | 'p2pkh' | 'unknown';

/**
 * Validate if an address is valid for the given network
 */
export function isValidAddress(address: string, network?: bitcoin.Network): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const targetNetwork = network || getNetwork();

  try {
    // Try to decode the address using bitcoinjs-lib
    bitcoin.address.toOutputScript(address, targetNetwork);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the type of a Bitcoin address
 */
export function getAddressType(address: string, network?: bitcoin.Network): AddressType {
  if (!isValidAddress(address, network)) {
    return 'unknown';
  }

  const targetNetwork = network || getNetwork();

  try {
    const outputScript = bitcoin.address.toOutputScript(address, targetNetwork);

    // Check for P2WPKH (witness pubkey hash) - starts with version 0, 20 bytes
    if (outputScript.length === 22 && outputScript[0] === 0x00 && outputScript[1] === 0x14) {
      return 'p2wpkh';
    }

    // Check for P2TR (taproot) - starts with version 1, 32 bytes
    if (outputScript.length === 34 && outputScript[0] === 0x51 && outputScript[1] === 0x20) {
      return 'p2tr';
    }

    // Check for P2SH (script hash) - starts with OP_HASH160, 20 bytes, OP_EQUAL
    if (outputScript.length === 23 && outputScript[0] === 0xa9 && outputScript[22] === 0x87) {
      return 'p2sh';
    }

    // Check for P2PKH (pubkey hash) - starts with OP_DUP OP_HASH160, 20 bytes, OP_EQUALVERIFY OP_CHECKSIG
    if (
      outputScript.length === 25 &&
      outputScript[0] === 0x76 &&
      outputScript[1] === 0xa9 &&
      outputScript[23] === 0x88 &&
      outputScript[24] === 0xac
    ) {
      return 'p2pkh';
    }

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Check if address is a Bech32 address (segwit v0 or v1+)
 */
export function isBech32Address(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Bech32 addresses start with bc (mainnet) or tb (testnet/signet)
  return address.toLowerCase().startsWith('bc1') || address.toLowerCase().startsWith('tb1');
}

/**
 * Check if address is a Taproot address (P2TR)
 */
export function isTaprootAddress(address: string, network?: bitcoin.Network): boolean {
  return getAddressType(address, network) === 'p2tr';
}

/**
 * Validate address format and network compatibility
 */
export function validateAddressForNetwork(
  address: string,
  networkName: 'testnet' | 'signet',
): {
  isValid: boolean;
  addressType: AddressType;
  error?: string;
} {
  if (!address) {
    return {
      isValid: false,
      addressType: 'unknown',
      error: 'Address is required',
    };
  }

  const network = networkName === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.testnet;
  const isValid = isValidAddress(address, network);
  const addressType = getAddressType(address, network);

  if (!isValid) {
    return {
      isValid: false,
      addressType: 'unknown',
      error: `Invalid address for ${networkName} network`,
    };
  }

  // Check if address uses correct prefix for testnet/signet
  if (isBech32Address(address) && !address.toLowerCase().startsWith('tb1')) {
    return {
      isValid: false,
      addressType,
      error: `Address should start with 'tb1' for ${networkName} network`,
    };
  }

  return {
    isValid: true,
    addressType,
  };
}

/**
 * Extract address info including type and network validation
 */
export function getAddressInfo(
  address: string,
  network?: bitcoin.Network,
): {
  isValid: boolean;
  type: AddressType;
  isBech32: boolean;
  isTaproot: boolean;
  network: string;
} {
  const targetNetwork = network || getNetwork();
  const isValid = isValidAddress(address, targetNetwork);
  const type = getAddressType(address, targetNetwork);
  const isBech32 = isBech32Address(address);
  const isTaproot = isTaprootAddress(address, targetNetwork);

  return {
    isValid,
    type,
    isBech32,
    isTaproot,
    network: targetNetwork.bech32 || 'unknown',
  };
}
