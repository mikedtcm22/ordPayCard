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

import type { VerifyPaymentOptions } from './types';
import { parseOpReturn, isExpired } from './opReturn';
import { sumOutputsToAddress } from './sumToCreator';

function isHex(s: string): boolean {
  return /^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0;
}

function isTxid(s: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(s);
}

async function resolveRawTxHex(txhexOrId: string, opts: VerifyPaymentOptions): Promise<string | null> {
  // Prefer txid resolution when the input looks like a txid and a resolver is available
  if (isTxid(txhexOrId) && opts.fetchTx) {
    const p = opts.fetchTx(txhexOrId);
    if (opts.withTimeout && typeof opts.fetchTimeoutMs === 'number') {
      return await opts.withTimeout(p, opts.fetchTimeoutMs);
    }
    return await p;
  }
  // Otherwise accept raw hex directly
  if (isHex(txhexOrId)) return txhexOrId;
  return null;
}

function passesBlockGate(txBlockHeight: unknown, minBlock: unknown): boolean {
  if (typeof minBlock !== 'number') return true;
  if (typeof txBlockHeight !== 'number') return false;
  return txBlockHeight >= minBlock;
}

export async function verifyPayment(
  txhexOrId: string,
  creatorAddr: string,
  minFee: bigint,
  nftId: string,
  opts: VerifyPaymentOptions,
): Promise<bigint> {
  // Acquire raw tx hex. Current tests supply hex directly.
  const rawTxHex = await resolveRawTxHex(txhexOrId, opts);
  if (!rawTxHex) return 0n;

  // Parse OP_RETURN and enforce binding
  const parsed = parseOpReturn(rawTxHex);
  if (!parsed) return 0n;
  if (parsed.nftId !== nftId) return 0n;
  if (isExpired(parsed.expiryBlock, opts.currentBlock)) return 0n;

  // Optional block gating relative to last transfer height
  if (!passesBlockGate(opts.txBlockHeight, opts.minBlock)) return 0n;

  // Sum outputs paying to the creator
  const sumToCreator = sumOutputsToAddress(rawTxHex, creatorAddr, opts.network);
  if (sumToCreator < minFee) return 0n;
  return sumToCreator;
}


