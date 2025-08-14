/**
 * PSBT (Partially Signed Bitcoin Transaction) Service
 *
 * Provides utilities for creating and managing PSBTs for Bitcoin transactions.
 * This service handles:
 * - PSBT creation for funding transactions
 * - UTXO management and input/output configuration
 * - Fee calculation utilities
 * - PSBT validation and encoding
 */

import * as bitcoin from 'bitcoinjs-lib';
import { getNetwork } from './bitcoin';

/**
 * UTXO input for PSBT creation
 */
export interface UtxoInput {
  txid: string;
  vout: number;
  value: number; // satoshis
  scriptPubKey: string; // hex
  address?: string;
}

/**
 * Transaction output
 */
export interface TxOutput {
  address: string;
  value: number; // satoshis
}

/**
 * PSBT creation parameters
 */
export interface CreatePsbtParams {
  inputs: UtxoInput[];
  outputs: TxOutput[];
  feeRate?: number; // sats/vByte
  changeAddress?: string;
}

/**
 * PSBT creation result
 */
export interface PsbtResult {
  psbtBase64: string;
  psbtHex: string;
  estimatedFee: number;
  totalInput: number;
  totalOutput: number;
  changeAmount?: number | undefined;
}

/**
 * Create a funding PSBT with given inputs and outputs
 */
export function createFundingPsbt(params: CreatePsbtParams): PsbtResult {
  const { inputs, outputs, feeRate = 10, changeAddress } = params;
  const network = getNetwork();

  // Validate inputs
  if (!inputs || inputs.length === 0) {
    throw new Error('At least one input is required');
  }

  if (!outputs || outputs.length === 0) {
    throw new Error('At least one output is required');
  }

  // Create new PSBT
  const psbt = new bitcoin.Psbt({ network });

  // Calculate totals
  const totalInput = inputs.reduce((sum, input) => sum + input.value, 0);
  const totalRequestedOutput = outputs.reduce((sum, output) => sum + output.value, 0);

  // Estimate transaction size (rough approximation)
  // Base size: 10 bytes
  // Each input: ~148 bytes (for P2WPKH)
  // Each output: ~34 bytes (for P2WPKH)
  const estimatedSize = 10 + inputs.length * 148 + outputs.length * 34;
  const estimatedFee = Math.ceil(estimatedSize * feeRate);

  // Calculate change
  const changeAmount = totalInput - totalRequestedOutput - estimatedFee;

  if (changeAmount < 0) {
    throw new Error(
      `Insufficient funds. Need ${totalRequestedOutput + estimatedFee} sats, have ${totalInput} sats`,
    );
  }

  try {
    // Add inputs
    inputs.forEach(input => {
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        witnessUtxo: {
          script: Buffer.from(input.scriptPubKey, 'hex'),
          value: input.value,
        },
      });
    });

    // Add outputs
    outputs.forEach(output => {
      psbt.addOutput({
        address: output.address,
        value: output.value,
      });
    });

    // Add change output if there's change and we have a change address
    if (changeAmount > 0 && changeAddress) {
      // Only add change if it's above dust threshold (546 sats)
      if (changeAmount >= 546) {
        psbt.addOutput({
          address: changeAddress,
          value: changeAmount,
        });
      }
    }

    // Get PSBT in different formats
    const psbtBase64 = psbt.toBase64();
    const psbtHex = psbt.toHex();

    return {
      psbtBase64,
      psbtHex,
      estimatedFee,
      totalInput,
      totalOutput: totalRequestedOutput + (changeAmount >= 546 ? changeAmount : 0),
      changeAmount: changeAmount >= 546 ? changeAmount : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to create PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Validate a PSBT string (base64 or hex)
 */
export function validatePsbt(psbtString: string): {
  isValid: boolean;
  format?: 'base64' | 'hex';
  error?: string;
} {
  try {
    const network = getNetwork();

    // Try base64 first
    try {
      bitcoin.Psbt.fromBase64(psbtString, { network });
      return { isValid: true, format: 'base64' };
    } catch {
      // Try hex
      try {
        bitcoin.Psbt.fromHex(psbtString, { network });
        return { isValid: true, format: 'hex' };
      } catch (hexError) {
        return {
          isValid: false,
          error: `Invalid PSBT format: ${hexError instanceof Error ? hexError.message : 'Unknown error'}`,
        };
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `PSBT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get PSBT information without modifying it
 */
export function getPsbtInfo(psbtString: string): {
  inputCount: number;
  outputCount: number;
  totalInput: number;
  totalOutput: number;
  fee?: number | undefined;
  format: 'base64' | 'hex';
} {
  const network = getNetwork();

  let psbt: bitcoin.Psbt;
  let format: 'base64' | 'hex';

  // Try to parse PSBT
  try {
    psbt = bitcoin.Psbt.fromBase64(psbtString, { network });
    format = 'base64';
  } catch {
    try {
      psbt = bitcoin.Psbt.fromHex(psbtString, { network });
      format = 'hex';
    } catch {
      throw new Error('Invalid PSBT format');
    }
  }

  // Extract information
  const inputCount = psbt.inputCount;
  const outputCount = psbt.txOutputs.length;

  // Calculate totals
  const totalOutput = psbt.txOutputs.reduce((sum, output) => sum + output.value, 0);

  // Get total input (if witness UTXOs are present)
  let totalInput = 0;
  try {
    for (let i = 0; i < inputCount; i++) {
      const input = psbt.data.inputs[i];
      if (input && input.witnessUtxo) {
        totalInput += input.witnessUtxo.value;
      }
    }
  } catch {
    // Inputs might not have witness UTXO data
  }

  const fee = totalInput > 0 ? totalInput - totalOutput : undefined;

  return {
    inputCount,
    outputCount,
    totalInput,
    totalOutput,
    fee,
    format,
  };
}

/**
 * Create dummy UTXO for testing purposes
 */
export function createDummyUtxo(value: number = 100000): UtxoInput {
  // Generate a dummy transaction ID (32 bytes of random data)
  const dummyTxid = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('');

  // Create a simple P2WPKH script (OP_0 + 20 bytes)
  const dummyPubkeyHash = Array.from({ length: 20 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join('');
  const scriptPubKey = `0014${dummyPubkeyHash}`;

  return {
    txid: dummyTxid,
    vout: 0,
    value,
    scriptPubKey,
    address: 'tb1q' + 'dummy_address_for_testing_only',
  };
}
