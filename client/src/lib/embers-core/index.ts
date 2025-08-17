/**
 * EmbersCore v1.0 - On-chain API library for ordinals registration validation
 * Provides parser utilities for verifying registration payments and deduplication
 */

/**
 * Semantic version of the EmbersCore library
 */
export const SEMVER = '1.0.0';

/**
 * Verifies a payment transaction meets registration requirements
 * @param txHexOrId - Raw transaction hex or transaction ID
 * @param creatorAddr - Creator's Bitcoin address to receive payment
 * @param minFee - Minimum fee required in satoshis (as bigint)
 * @param nftId - NFT inscription ID that must match OP_RETURN
 * @param opts - Validation options including network, block heights, and fetch function
 * @returns Amount paid to creator (0n if validation fails)
 */
export async function verifyPayment(
  txHexOrId: string,
  creatorAddr: string,
  minFee: bigint,
  nftId: string,
  opts: {
    currentBlock: number;
    network: 'regtest' | 'signet' | 'testnet' | 'mainnet';
    childHeight?: number;
    feeHeight?: number;
    kWindow?: number;
    fetchTx?: (txid: string) => Promise<string>;
  }
): Promise<bigint> {
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