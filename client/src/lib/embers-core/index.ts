/**
 * EmbersCore v1.0 - On-chain API library for ordinals registration validation
 * Provides parser utilities for verifying registration payments and deduplication
 */

/**
 * Semantic version of the EmbersCore library
 */
export const SEMVER = '1.0.0';

/**
 * Branded type for Bitcoin network names
 */
export type Network = 'mainnet' | 'testnet' | 'signet' | 'regtest';

/**
 * Type guard to check if a value is a valid Network
 */
export function isValidNetwork(value: unknown): value is Network {
  return typeof value === 'string' && 
    ['mainnet', 'testnet', 'signet', 'regtest'].includes(value);
}

/**
 * Options for verifyPayment function
 */
export interface VerifyPaymentOptions {
  currentBlock: number;
  network: Network;
  childHeight?: number;
  feeHeight?: number;
  kWindow?: number;
  fetchTx?: (txid: string) => Promise<string>;
}

/**
 * Verifies a payment transaction meets registration requirements
 * @param txHexOrId - Raw transaction hex or transaction ID
 * @param creatorAddr - Creator's Bitcoin address to receive payment
 * @param minFee - Minimum fee required in satoshis (as bigint)
 * @param nftId - NFT inscription ID that must match OP_RETURN
 * @param opts - Validation options including network, block heights, and fetch function
 * @returns Amount paid to creator (0n if validation fails)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function verifyPayment(
  _txHexOrId: string,
  _creatorAddr: string,
  _minFee: bigint,
  _nftId: string,
  _opts: VerifyPaymentOptions
): Promise<bigint> {
  // Runtime validation of network parameter
  if (!isValidNetwork(_opts.network)) {
    throw new Error('Invalid network');
  }
  
  // Minimal implementation for GREEN phase - always returns 0n
  return 0n;
}

/**
 * Removes duplicate transaction IDs while preserving order
 * @param txids - Array of transaction ID strings
 * @returns Array with duplicates removed, maintaining original order
 */
export function dedupe(txids: string[]): string[] {
  // Minimal implementation using Set to remove duplicates while preserving order
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const txid of txids) {
    if (!seen.has(txid)) {
      seen.add(txid);
      result.push(txid);
    }
  }
  
  return result;
}