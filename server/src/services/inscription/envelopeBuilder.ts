/**
 * @fileoverview Ordinals inscription envelope builder
 * @module services/inscription/envelopeBuilder
 * 
 * Creates properly formatted inscription envelopes that comply with
 * ordinals protocol standards for inscription recognition.
 */

import * as bitcoin from 'bitcoinjs-lib';
import { getNetwork } from '../bitcoin';

/**
 * Inscription envelope parameters
 */
export interface InscriptionData {
  contentType: string;
  content: Buffer;
  metadata?: Record<string, any>;
}

/**
 * Build inscription envelope script
 * Following ord 0.18.0+ standards
 * 
 * Format:
 * OP_FALSE
 * OP_IF
 *   OP_PUSH "ord"
 *   OP_1
 *   OP_PUSH <content-type>
 *   OP_0
 *   OP_PUSH <content>
 * OP_ENDIF
 */
export function buildInscriptionScript(data: InscriptionData): Buffer {
  const { contentType, content, metadata } = data;
  
  // Build envelope components
  const parts: (Buffer | number)[] = [];
  
  // Start with OP_FALSE OP_IF
  const OP_FALSE = bitcoin.opcodes['OP_FALSE'];
  const OP_IF = bitcoin.opcodes['OP_IF'];
  if (OP_FALSE === undefined || OP_IF === undefined) {
    throw new Error('Bitcoin opcodes not available');
  }
  parts.push(OP_FALSE);
  parts.push(OP_IF);
  
  // Protocol identifier "ord"
  parts.push(Buffer.from('ord', 'utf8'));
  
  // OP_1 indicates content type follows
  const OP_1 = bitcoin.opcodes['OP_1'];
  if (OP_1 === undefined) throw new Error('OP_1 opcode not available');
  parts.push(OP_1);
  
  // Content type
  parts.push(Buffer.from(contentType, 'utf8'));
  
  // OP_0 indicates content follows
  const OP_0 = bitcoin.opcodes['OP_0'];
  if (OP_0 === undefined) throw new Error('OP_0 opcode not available');
  parts.push(OP_0);
  
  // Push content in chunks if needed (520 byte limit per push)
  const maxChunkSize = 520;
  for (let i = 0; i < content.length; i += maxChunkSize) {
    const chunk = content.subarray(i, i + maxChunkSize);
    parts.push(chunk);
  }
  
  // Add metadata if provided (optional, not standard but supported)
  if (metadata && Object.keys(metadata).length > 0) {
    if (OP_1 === undefined || OP_0 === undefined) throw new Error('Opcodes not available');
    parts.push(OP_1);
    parts.push(Buffer.from('metadata', 'utf8'));
    parts.push(OP_0);
    parts.push(Buffer.from(JSON.stringify(metadata), 'utf8'));
  }
  
  // Close with OP_ENDIF
  const OP_ENDIF = bitcoin.opcodes['OP_ENDIF'];
  if (OP_ENDIF === undefined) throw new Error('OP_ENDIF opcode not available');
  parts.push(OP_ENDIF);
  
  return bitcoin.script.compile(parts);
}

/**
 * Create taproot inscription output
 * This creates a P2TR output that commits to the inscription script
 */
export function createInscriptionOutput(
  inscriptionScript: Buffer,
  internalPubkey: Buffer
): { output: Buffer; address: string; tapLeafScript: any } {
  const network = getNetwork();
  
  // Remove prefix byte if present (convert from 33 to 32 bytes)
  const xOnlyPubkey = internalPubkey.length === 33 ? internalPubkey.subarray(1) : internalPubkey;
  
  // Create tap leaf with inscription script
  const tapLeafScript = {
    leafVersion: 0xc0, // Tapscript leaf version
    script: inscriptionScript,
  };
  
  // Create taproot output
  const scriptTree = {
    output: inscriptionScript
  };
  const p2tr = bitcoin.payments.p2tr({
    internalPubkey: xOnlyPubkey,
    scriptTree,
    network,
  });
  
  if (!p2tr.output || !p2tr.address) {
    throw new Error('Failed to create taproot inscription output');
  }
  
  return {
    output: p2tr.output,
    address: p2tr.address,
    tapLeafScript,
  };
}

/**
 * Calculate inscription size including witness data
 */
export function calculateInscriptionSize(
  inscriptionContent: string | Buffer,
  contentType: string
): number {
  const content = typeof inscriptionContent === 'string' 
    ? Buffer.from(inscriptionContent, 'utf8') 
    : inscriptionContent;
  
  // Build the inscription to get exact size
  const inscriptionData = { contentType, content };
  const inscriptionScript = buildInscriptionScript(inscriptionData);
  
  // Calculate witness size
  // Inscription witness includes:
  // - Inscription script
  // - Control block (~33 bytes)
  // - Signature (~64 bytes)
  const witnessSize = inscriptionScript.length + 33 + 64;
  
  // Calculate total transaction size
  // Base tx: ~100 bytes
  // Input: ~40 bytes
  // Output: ~40 bytes
  // Witness: calculated above
  const baseTxSize = 100 + 40 + 40;
  const totalSize = baseTxSize + Math.ceil(witnessSize / 4); // Witness counts as 1/4 for vsize
  
  return totalSize;
}

/**
 * Calculate fees for inscription transactions
 */
export function calculateInscriptionFee(
  inscriptionSize: number,
  feeRate: number,
  includeReveal: boolean = true
): {
  commitFee: number;
  revealFee: number;
  totalFee: number;
} {
  // Commit transaction (funds the inscription)
  // Typical size: 150-200 vbytes depending on inputs
  const commitTxSize = 200; // Conservative estimate
  const commitFee = Math.ceil(commitTxSize * feeRate);
  
  // Reveal transaction (contains the inscription)
  const revealTxSize = inscriptionSize;
  const revealFee = includeReveal ? Math.ceil(revealTxSize * feeRate) : 0;
  
  // Add 10% buffer for safety
  const buffer = 1.1;
  
  return {
    commitFee: Math.ceil(commitFee * buffer),
    revealFee: Math.ceil(revealFee * buffer),
    totalFee: Math.ceil((commitFee + revealFee) * buffer),
  };
}

/**
 * Validate inscription content
 */
export function validateInscriptionContent(
  content: string | Buffer,
  contentType: string
): { valid: boolean; error?: string } {
  const contentBuffer = typeof content === 'string' 
    ? Buffer.from(content, 'utf8') 
    : content;
  
  // Check content size (reasonable limit for inscriptions)
  const maxSize = 400000; // 400KB limit
  if (contentBuffer.length > maxSize) {
    return { 
      valid: false, 
      error: `Content too large: ${contentBuffer.length} bytes (max ${maxSize})` 
    };
  }
  
  // Validate content type format
  if (!contentType || contentType.length === 0) {
    return { valid: false, error: 'Content type is required' };
  }
  
  if (contentType.length > 100) {
    return { valid: false, error: 'Content type too long (max 100 characters)' };
  }
  
  // Basic MIME type validation
  const mimePattern = /^[a-zA-Z0-9][a-zA-Z0-9/\-+.]*$/;
  const mimeType = contentType.split(';')[0];
  if (!mimeType || !mimePattern.test(mimeType)) {
    return { valid: false, error: 'Invalid content type format' };
  }
  
  return { valid: true };
}

/**
 * Helper to create inscription data from HTML template
 */
export function createHtmlInscriptionData(
  htmlContent: string,
  metadata?: Record<string, any>
): InscriptionData {
  const data: InscriptionData = {
    contentType: 'text/html;charset=utf-8',
    content: Buffer.from(htmlContent, 'utf8'),
  };
  
  if (metadata) {
    data.metadata = metadata;
  }
  
  return data;
}