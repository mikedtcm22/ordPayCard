/**
 * OP_RETURN parser utilities for registration verification (client parity).
 *
 * Canonical payload (ASCII): "<nftId>|<expiryBlock>"
 * - Returns null when no OP_RETURN is present
 * - Throws on malformed hex input or malformed payload
 */

import type { ParsedOpReturnPayload } from './types';
import { assertValidHexString, hexToBytes, asciiHexToString } from './hex';

/**
 * Attempt to locate OP_RETURN (0x6a) in a generic hex blob and return its pushed data as hex.
 * Supports small immediate pushes (<=75), OP_PUSHDATA1 (0x4c), OP_PUSHDATA2 (0x4d), OP_PUSHDATA4 (0x4e).
 */
function findOpReturnDataHex(rawHex: string): string | null {
  const bytes = hexToBytes(rawHex);
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== 0x6a) continue; // OP_RETURN
    const opcode = bytes[i + 1];
    if (opcode == null) return null;
    let dataLen = 0;
    let dataStartIndex = 0;
    if (opcode <= 75) {
      dataLen = opcode;
      dataStartIndex = i + 2;
    } else if (opcode === 0x4c) {
      // OP_PUSHDATA1
      const len = bytes[i + 2];
      if (len == null) return null;
      dataLen = len;
      dataStartIndex = i + 3;
    } else if (opcode === 0x4d) {
      // OP_PUSHDATA2 (little-endian)
      const lsb = bytes[i + 2];
      const msb = bytes[i + 3];
      if (lsb == null || msb == null) return null;
      dataLen = lsb + (msb << 8);
      dataStartIndex = i + 4;
    } else if (opcode === 0x4e) {
      // OP_PUSHDATA4 (little-endian)
      const b0 = bytes[i + 2];
      const b1 = bytes[i + 3];
      const b2 = bytes[i + 4];
      const b3 = bytes[i + 5];
      if (b0 == null || b1 == null || b2 == null || b3 == null) return null;
      dataLen = b0 + (b1 << 8) + (b2 << 16) + (b3 << 24);
      dataStartIndex = i + 6;
    } else {
      // Unknown pattern after OP_RETURN
      continue;
    }

    const endIndex = dataStartIndex + dataLen;
    if (endIndex > bytes.length || dataLen < 0) return null;
    // Convert selected bytes to hex
    let hex = '';
    for (let j = dataStartIndex; j < endIndex; j++) {
      const b = bytes[j];
      if (b == null) return null;
      hex += b.toString(16).padStart(2, '0');
    }
    return hex;
  }
  return null;
}

/** Determine whether expiry has passed given current block. */
export function isExpired(expiryBlock: number, currentBlock: number): boolean {
  if (!Number.isInteger(expiryBlock) || !Number.isInteger(currentBlock)) {
    throw new Error('Invalid block numbers');
  }
  return currentBlock > expiryBlock;
}

/**
 * Parse OP_RETURN payload of the form "<nftId>|<expiryBlock>" from a raw tx hex blob.
 * Returns null when no OP_RETURN is present. Throws on malformed hex or malformed payload.
 */
export function parseOpReturn(rawTxHex: string): ParsedOpReturnPayload | null {
  assertValidHexString(rawTxHex);
  const dataHex = findOpReturnDataHex(rawTxHex);
  if (!dataHex) return null;

  const ascii = asciiHexToString(dataHex);
  if (ascii.length > 256) throw new Error('OP_RETURN payload too large');
  const sepIndex = ascii.indexOf('|');
  if (sepIndex === -1) throw new Error('Malformed OP_RETURN payload');

  const nftId = ascii.slice(0, sepIndex);
  const expiryStr = ascii.slice(sepIndex + 1);
  if (!nftId || !expiryStr) throw new Error('Malformed OP_RETURN payload');

  const expiryBlock = Number.parseInt(expiryStr, 10);
  if (!Number.isFinite(expiryBlock) || !Number.isInteger(expiryBlock) || expiryBlock < 0) {
    throw new Error('Invalid expiry block');
  }

  return { nftId, expiryBlock };
}
