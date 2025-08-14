/**
 * verifyPayment orchestration
 *
 * Validates a fee transaction against expected OP_RETURN binding and gating, and
 * returns the total amount paid to the creator address if it meets the minimum fee.
 *
 * Rules implemented:
 * - OP_RETURN must exist and match `<nftId>|<expiryBlock>`
 * - Must not be expired relative to `opts.currentBlock`
 * - If `opts.minBlock` provided, require `opts.txBlockHeight >= opts.minBlock`
 * - Sum all outputs that pay to `creatorAddr`; return 0n when below `minFee`
 */

import type { SupportedNetwork } from './types';
import { parseOpReturn, isExpired } from './opReturn';
import { sumOutputsToAddress } from './sumToCreator';

export interface VerifyPaymentOptions {
  currentBlock: number;
  network: SupportedNetwork;
  minBlock?: number;
  /** Optional: height of the tx's block when known (used for minBlock gating) */
  txBlockHeight?: number;
  /** Optional fetcher for tx hex when a txid is provided (not used in current tests) */
  fetchTx?: (txid: string) => Promise<string>;
}

export async function verifyPayment(
  txhexOrId: string,
  creatorAddr: string,
  minFee: bigint,
  nftId: string,
  opts: VerifyPaymentOptions,
): Promise<bigint> {
  // Acquire raw tx hex. Current tests supply hex directly.
  let rawTxHex = txhexOrId;
  if (!/^[0-9a-fA-F]+$/.test(rawTxHex) || rawTxHex.length % 2 !== 0) {
    // Treat as txid if looks like 64-hex; fetch if fetcher provided
    const isTxid = /^[0-9a-fA-F]{64}$/.test(txhexOrId);
    if (!isTxid || !opts.fetchTx) return 0n;
    rawTxHex = await opts.fetchTx(txhexOrId);
  }

  // Parse OP_RETURN and enforce binding
  const parsed = parseOpReturn(rawTxHex);
  if (!parsed) return 0n;
  if (parsed.nftId !== nftId) return 0n;
  if (isExpired(parsed.expiryBlock, opts.currentBlock)) return 0n;

  // Optional block gating relative to last transfer height
  if (typeof opts.minBlock === 'number') {
    const feeTxHeight = opts.txBlockHeight;
    if (typeof feeTxHeight !== 'number' || feeTxHeight < opts.minBlock) return 0n;
  }

  // Sum outputs paying to the creator
  const sumToCreator = sumOutputsToAddress(rawTxHex, creatorAddr, opts.network);
  if (sumToCreator < minFee) return 0n;
  return sumToCreator;
}


