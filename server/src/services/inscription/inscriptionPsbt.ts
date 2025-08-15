/**
 * @fileoverview PSBT creation service for ordinals inscriptions
 * @module services/inscription/inscriptionPsbt
 * 
 * Handles PSBT creation for membership card inscriptions including
 * commit and reveal transaction construction.
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { getNetwork } from '../bitcoin';
import { 
  buildInscriptionScript, 
  createInscriptionOutput,
  calculateInscriptionSize,
  calculateInscriptionFee,
  createHtmlInscriptionData
} from './envelopeBuilder';
import { UtxoInput } from '../psbt';

// Initialize ECPair
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

/**
 * Inscription PSBT creation parameters
 */
export interface CreateInscriptionPsbtParams {
  utxos: UtxoInput[];
  inscriptionContent: string; // HTML content
  recipientAddress: string;
  changeAddress: string;
  feeRate?: number; // sats/vByte
  initialTopUp?: number; // Optional initial balance
  treasuryAddress?: string; // Required if initialTopUp provided
}

/**
 * Inscription PSBT result
 */
export interface InscriptionPsbtResult {
  commitPsbt: string; // Base64 encoded
  revealPsbt: string; // Base64 encoded
  commitTxFee: number;
  revealTxFee: number;
  totalFee: number;
  inscriptionAddress: string;
  estimatedInscriptionId: string;
  instructions: string[];
}

/**
 * Commit transaction details for reveal PSBT creation
 */
interface CommitTxDetails {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: Buffer;
  tapLeafScript: any;
  internalPubkey: Buffer;
}

/**
 * Create PSBT pair for inscription
 * This creates both commit and reveal PSBTs that must be signed and broadcast in sequence
 */
export async function createInscriptionPsbt(
  params: CreateInscriptionPsbtParams
): Promise<InscriptionPsbtResult> {
  const {
    utxos,
    inscriptionContent,
    recipientAddress,
    changeAddress,
    feeRate = 10,
    initialTopUp,
    treasuryAddress
  } = params;
  
  const network = getNetwork();
  
  // Validate parameters
  if (initialTopUp && !treasuryAddress) {
    throw new Error('Treasury address required for initial top-up');
  }
  
  if (initialTopUp && initialTopUp < 546) {
    throw new Error('Initial top-up must be at least 546 sats (dust limit)');
  }
  
  // Generate temporary inscription keypair
  // In production, this would be derived from user's wallet
  const inscriptionKeypair = ECPair.makeRandom({ network });
  const internalPubkey = Buffer.from(inscriptionKeypair.publicKey);
  
  // Create inscription data
  const inscriptionData = createHtmlInscriptionData(inscriptionContent);
  const inscriptionScript = buildInscriptionScript(inscriptionData);
  
  // Create inscription output
  const { output, address, tapLeafScript } = createInscriptionOutput(
    inscriptionScript,
    internalPubkey
  );
  
  // Calculate fees
  const inscriptionSize = calculateInscriptionSize(inscriptionContent, inscriptionData.contentType);
  const fees = calculateInscriptionFee(inscriptionSize, feeRate);
  
  // Create commit transaction PSBT
  const { psbt: commitPsbt, outputValue } = createCommitPsbt({
    utxos,
    inscriptionOutput: output,
    inscriptionValue: 10000, // Inscription funding amount
    changeAddress,
    feeRate,
    network
  });
  
  // Create placeholder commit tx details for reveal PSBT
  // In production, these values would be filled after commit tx is broadcast
  const commitTxDetails: CommitTxDetails = {
    txid: '0'.repeat(64), // Placeholder - will be replaced after commit broadcast
    vout: 0, // Inscription is always first output
    value: outputValue,
    scriptPubKey: output,
    tapLeafScript,
    internalPubkey: Buffer.from(internalPubkey.subarray(1)) // Remove prefix for x-only
  };
  
  // Create reveal transaction PSBT
  const revealPsbtParams: Parameters<typeof createRevealPsbt>[0] = {
    commitTxDetails,
    inscriptionScript,
    recipientAddress,
    feeRate,
    network
  };
  
  if (initialTopUp !== undefined) {
    revealPsbtParams.initialTopUp = initialTopUp;
  }
  if (treasuryAddress !== undefined) {
    revealPsbtParams.treasuryAddress = treasuryAddress;
  }
  
  const revealPsbt = createRevealPsbt(revealPsbtParams);
  
  // Generate instructions for the user
  const instructions = generateInstructions(initialTopUp);
  
  return {
    commitPsbt: commitPsbt.toBase64(),
    revealPsbt: revealPsbt.toBase64(),
    commitTxFee: fees.commitFee,
    revealTxFee: fees.revealFee,
    totalFee: fees.totalFee,
    inscriptionAddress: address,
    estimatedInscriptionId: 'pending-commit-broadcast',
    instructions
  };
}

/**
 * Create commit transaction PSBT
 */
function createCommitPsbt(params: {
  utxos: UtxoInput[];
  inscriptionOutput: Buffer;
  inscriptionValue: number;
  changeAddress: string;
  feeRate: number;
  network: bitcoin.Network;
}): { psbt: bitcoin.Psbt; outputValue: number } {
  const { utxos, inscriptionOutput, inscriptionValue, changeAddress, feeRate, network } = params;
  
  const psbt = new bitcoin.Psbt({ network });
  
  // Add inputs
  let totalInput = 0;
  utxos.forEach(utxo => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: Buffer.from(utxo.scriptPubKey, 'hex'),
        value: utxo.value
      }
    });
    totalInput += utxo.value;
  });
  
  // Add inscription output (this funds the inscription)
  psbt.addOutput({
    script: inscriptionOutput,
    value: inscriptionValue
  });
  
  // Calculate change
  const estimatedSize = 150 + (utxos.length * 100); // Conservative estimate
  const commitFee = Math.ceil(estimatedSize * feeRate);
  const changeAmount = totalInput - inscriptionValue - commitFee;
  
  if (changeAmount < 0) {
    throw new Error(
      `Insufficient funds. Need ${inscriptionValue + commitFee} sats, have ${totalInput} sats`
    );
  }
  
  // Add change output if above dust
  if (changeAmount >= 546) {
    psbt.addOutput({
      address: changeAddress,
      value: changeAmount
    });
  }
  
  return { psbt, outputValue: inscriptionValue };
}

/**
 * Create reveal transaction PSBT
 */
function createRevealPsbt(params: {
  commitTxDetails: CommitTxDetails;
  inscriptionScript: Buffer;
  recipientAddress: string;
  feeRate: number;
  network: bitcoin.Network;
  initialTopUp?: number;
  treasuryAddress?: string;
}): bitcoin.Psbt {
  const {
    commitTxDetails,
    inscriptionScript,
    recipientAddress,
    feeRate,
    network,
    initialTopUp,
    treasuryAddress
  } = params;
  
  const psbt = new bitcoin.Psbt({ network });
  
  // Add commit output as input with taproot fields
  psbt.addInput({
    hash: commitTxDetails.txid,
    index: commitTxDetails.vout,
    witnessUtxo: {
      script: commitTxDetails.scriptPubKey,
      value: commitTxDetails.value
    },
    tapInternalKey: commitTxDetails.internalPubkey,
    tapLeafScript: [{
      leafVersion: commitTxDetails.tapLeafScript.leafVersion,
      script: inscriptionScript,
      controlBlock: Buffer.alloc(33) // Placeholder - will be computed during signing
    }]
  });
  
  // Calculate reveal transaction size for fee
  const baseRevealSize = 200; // Base transaction size
  const witnessSize = inscriptionScript.length + 64 + 33; // Script + signature + control block
  const revealVsize = baseRevealSize + Math.ceil(witnessSize / 4);
  const revealFee = Math.ceil(revealVsize * feeRate * 1.1); // 10% buffer
  
  // Add inscription output (to recipient)
  const inscriptionOutputValue = 546; // Dust limit
  psbt.addOutput({
    address: recipientAddress,
    value: inscriptionOutputValue
  });
  
  // Add initial top-up output if requested
  if (initialTopUp && treasuryAddress) {
    psbt.addOutput({
      address: treasuryAddress,
      value: initialTopUp
    });
  }
  
  // Calculate total outputs
  const totalOutputs = inscriptionOutputValue + (initialTopUp || 0);
  const remainingAfterFee = commitTxDetails.value - totalOutputs - revealFee;
  
  // Validate we have enough funds
  if (remainingAfterFee < -10) { // Allow small negative due to fee estimation
    throw new Error(
      `Insufficient funds in commit tx. Have ${commitTxDetails.value}, ` +
      `need ${totalOutputs + revealFee} (outputs: ${totalOutputs}, fee: ${revealFee})`
    );
  }
  
  return psbt;
}

/**
 * Update reveal PSBT with actual commit transaction details
 * This is called after the commit transaction is broadcast
 */
export function updateRevealPsbt(
  revealPsbtBase64: string,
  commitTxid: string,
  network?: bitcoin.Network
): string {
  const psbt = bitcoin.Psbt.fromBase64(revealPsbtBase64, { 
    network: network || getNetwork() 
  });
  
  // Update the input with actual commit txid
  const input = psbt.data.inputs[0];
  if (input) {
    // Create new hash buffer from txid
    const hashBuffer = Buffer.from(commitTxid, 'hex').reverse(); // Reverse for little-endian
    
    // Update input hash
    psbt.data.inputs[0] = {
      ...input,
      // @ts-expect-error - accessing internal property
      hash: hashBuffer
    };
  }
  
  return psbt.toBase64();
}

/**
 * Generate user instructions for the inscription process
 */
function generateInstructions(includesTopUp?: number): string[] {
  const instructions = [
    '1. Import and sign the COMMIT PSBT in your wallet',
    '2. Broadcast the signed commit transaction',
    '3. Wait for the commit tx to appear in mempool',
    '4. Note the commit transaction ID',
    '5. Update the reveal PSBT with the commit txid',
    '6. Import and sign the REVEAL PSBT in your wallet',
    '7. Broadcast the signed reveal transaction',
    '8. Your inscription will be created once confirmed'
  ];
  
  if (includesTopUp) {
    instructions.push(
      `9. Initial top-up of ${includesTopUp} sats will be sent to treasury`
    );
  }
  
  return instructions;
}

/**
 * Estimate total cost for inscription creation
 */
export function estimateInscriptionCost(
  htmlContent: string,
  feeRate: number = 10,
  includeTopUp: number = 0
): {
  inscriptionSize: number;
  commitFee: number;
  revealFee: number;
  topUpAmount: number;
  totalCost: number;
  breakdown: string[];
} {
  const inscriptionSize = calculateInscriptionSize(htmlContent, 'text/html;charset=utf-8');
  const fees = calculateInscriptionFee(inscriptionSize, feeRate);
  
  const breakdown = [
    `Inscription size: ${inscriptionSize} vbytes`,
    `Commit transaction: ${fees.commitFee} sats`,
    `Reveal transaction: ${fees.revealFee} sats`,
    `Inscription output: 546 sats (dust limit)`,
  ];
  
  if (includeTopUp > 0) {
    breakdown.push(`Initial top-up: ${includeTopUp} sats`);
  }
  
  const totalCost = fees.totalFee + 546 + includeTopUp;
  breakdown.push(`Total cost: ${totalCost} sats`);
  
  return {
    inscriptionSize,
    commitFee: fees.commitFee,
    revealFee: fees.revealFee,
    topUpAmount: includeTopUp,
    totalCost,
    breakdown
  };
}