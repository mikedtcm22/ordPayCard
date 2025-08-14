# Phase 2.2.2: PSBT Generation for Inscriptions

**Feature:** Membership Card Creation  
**Sub-Phase:** 2.2.2 - PSBT Generation  
**Duration:** 3-4 days  
**Document Type:** Implementation Plan  
**Date:** August 1, 2025  

---

## Overview

### Goal
Implement PSBT (Partially Signed Bitcoin Transaction) generation specifically for creating ordinals inscriptions. This includes proper inscription envelope formatting, fee calculation for inscription transactions, and optional initial top-up support in the same transaction.

### Critical Importance
PSBT generation for inscriptions requires precise formatting to ensure the inscription is valid and recognized by ordinals indexers. Incorrect formatting will result in lost funds without creating a valid inscription.

### Success Criteria
- PSBT creates valid inscription envelopes recognized by ordinals protocol
- Fee calculation accounts for inscription size and witness data
- Optional initial top-up can be included in same transaction
- Generated PSBTs are compatible with Unisat wallet
- Transaction size estimation is accurate within 5%
- All outputs follow ordinals best practices

---

## Prerequisites

### Technical Knowledge
- Ordinals inscription envelope format
- Bitcoin script and witness structure
- PSBT format and fields
- Fee estimation for witness transactions
- Ordinals "first sat" rules

### Code Dependencies
```typescript
// Existing services we'll build upon
import * as bitcoin from 'bitcoinjs-lib';
import { getNetwork } from '@/services/bitcoin';
import { createFundingPsbt } from '@/services/psbt';
```

### Environment Setup
```bash
# Install additional dependencies for inscription handling
npm install --save buffer
npm install --save-dev @types/node

# Create new service directory
mkdir -p server/src/services/inscription
```

---

## Implementation Steps

### Step 1: Create Inscription Envelope Builder

**File:** `server/src/services/inscription/envelopeBuilder.ts`

```typescript
/**
 * @fileoverview Ordinals inscription envelope builder
 * @module services/inscription/envelopeBuilder
 * 
 * Creates properly formatted inscription envelopes that comply with
 * ordinals protocol standards for inscription recognition.
 */

import * as bitcoin from 'bitcoinjs-lib';

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
 */
export function buildInscriptionScript(data: InscriptionData): Buffer {
  const { contentType, content, metadata } = data;
  
  // Build envelope components
  const parts: (Buffer | number)[] = [];
  
  // Protocol identifier
  parts.push(Buffer.from('ord', 'utf8'));
  
  // OP_1 indicates start of envelope
  parts.push(bitcoin.opcodes.OP_1);
  
  // Content type push
  parts.push(Buffer.from(contentType, 'utf8'));
  
  // OP_0 indicates content follows
  parts.push(bitcoin.opcodes.OP_0);
  
  // Push content in chunks if needed (520 byte limit per push)
  const maxChunkSize = 520;
  for (let i = 0; i < content.length; i += maxChunkSize) {
    const chunk = content.slice(i, i + maxChunkSize);
    parts.push(chunk);
  }
  
  // Add metadata if provided
  if (metadata) {
    parts.push(bitcoin.opcodes.OP_1);
    parts.push(Buffer.from(JSON.stringify(metadata), 'utf8'));
  }
  
  // OP_ENDIF to close the envelope
  parts.push(bitcoin.opcodes.OP_ENDIF);
  
  return bitcoin.script.compile(parts);
}

/**
 * Create inscription reveal script
 */
export function createInscriptionRevealScript(
  inscriptionScript: Buffer,
  publicKey: Buffer
): Buffer {
  // Taproot script construction
  const scriptTree = {
    output: inscriptionScript
  };
  
  const { output, witness } = bitcoin.payments.p2tr({
    internalPubkey: publicKey.slice(1), // Remove prefix byte
    scriptTree,
    network: getNetwork()
  });
  
  if (!output || !witness) {
    throw new Error('Failed to create inscription reveal script');
  }
  
  return output;
}

/**
 * Calculate inscription fee
 */
export function calculateInscriptionFee(
  inscriptionSize: number,
  feeRate: number
): number {
  // Base transaction size (approx)
  const baseTxSize = 150; // Commit tx
  const revealTxSize = 200 + inscriptionSize; // Reveal tx with inscription
  
  // Calculate total fee needed
  const totalSize = baseTxSize + revealTxSize;
  const fee = Math.ceil(totalSize * feeRate);
  
  // Add buffer for fee variance
  return Math.ceil(fee * 1.1); // 10% buffer
}
```

### Step 2: Implement Inscription PSBT Service

**File:** `server/src/services/inscription/inscriptionPsbt.ts`

```typescript
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
  createInscriptionRevealScript,
  calculateInscriptionFee 
} from './envelopeBuilder';
import { UtxoInput, TxOutput } from '../psbt';

const ECPair = ECPairFactory(ecc);

/**
 * Inscription PSBT creation parameters
 */
export interface CreateInscriptionPsbtParams {
  utxos: UtxoInput[];
  inscriptionContent: string; // HTML content
  recipientAddress: string;
  changeAddress: string;
  feeRate: number; // sats/vByte
  initialTopUp?: number; // Optional initial balance
  treasuryAddress?: string; // Required if initialTopUp provided
}

/**
 * Inscription PSBT result
 */
export interface InscriptionPsbtResult {
  commitPsbt: bitcoin.Psbt;
  revealPsbt: bitcoin.Psbt;
  commitTxFee: number;
  revealTxFee: number;
  totalFee: number;
  inscriptionAddress: string;
  estimatedInscriptionId: string;
}

/**
 * Create PSBT pair for inscription
 */
export async function createInscriptionPsbt(
  params: CreateInscriptionPsbtParams
): Promise<InscriptionPsbtResult> {
  const {
    utxos,
    inscriptionContent,
    recipientAddress,
    changeAddress,
    feeRate,
    initialTopUp,
    treasuryAddress
  } = params;
  
  const network = getNetwork();
  
  // Validate initial top-up parameters
  if (initialTopUp && !treasuryAddress) {
    throw new Error('Treasury address required for initial top-up');
  }
  
  // Generate inscription keypair (temporary, will be replaced by wallet)
  const inscriptionKeypair = ECPair.makeRandom({ network });
  const inscriptionPubkey = inscriptionKeypair.publicKey;
  
  // Build inscription envelope
  const inscriptionData = {
    contentType: 'text/html;charset=utf-8',
    content: Buffer.from(inscriptionContent, 'utf8')
  };
  const inscriptionScript = buildInscriptionScript(inscriptionData);
  
  // Create reveal script
  const revealScript = createInscriptionRevealScript(
    inscriptionScript,
    inscriptionPubkey
  );
  
  // Calculate fees
  const inscriptionFee = calculateInscriptionFee(
    inscriptionContent.length,
    feeRate
  );
  
  // Create commit transaction PSBT
  const commitPsbt = createCommitPsbt({
    utxos,
    revealScript,
    inscriptionFee,
    changeAddress,
    feeRate,
    network
  });
  
  // Create reveal transaction PSBT
  const revealPsbt = createRevealPsbt({
    commitTxid: getEstimatedTxid(commitPsbt),
    inscriptionKeypair,
    inscriptionScript,
    recipientAddress,
    feeRate,
    network,
    initialTopUp,
    treasuryAddress
  });
  
  // Calculate fees
  const commitTxFee = calculatePsbtFee(commitPsbt);
  const revealTxFee = calculatePsbtFee(revealPsbt);
  
  return {
    commitPsbt,
    revealPsbt,
    commitTxFee,
    revealTxFee,
    totalFee: commitTxFee + revealTxFee,
    inscriptionAddress: bitcoin.address.fromOutputScript(revealScript, network),
    estimatedInscriptionId: `${getEstimatedTxid(revealPsbt)}i0`
  };
}

/**
 * Create commit transaction PSBT
 */
function createCommitPsbt(params: {
  utxos: UtxoInput[];
  revealScript: Buffer;
  inscriptionFee: number;
  changeAddress: string;
  feeRate: number;
  network: bitcoin.Network;
}): bitcoin.Psbt {
  const { utxos, revealScript, inscriptionFee, changeAddress, feeRate, network } = params;
  
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
  
  // Add inscription output (funds for reveal)
  psbt.addOutput({
    script: revealScript,
    value: inscriptionFee
  });
  
  // Calculate change
  const estimatedSize = 150 + (utxos.length * 100); // Rough estimate
  const commitFee = Math.ceil(estimatedSize * feeRate);
  const changeAmount = totalInput - inscriptionFee - commitFee;
  
  if (changeAmount < 0) {
    throw new Error('Insufficient funds for inscription');
  }
  
  // Add change output if above dust
  if (changeAmount > 546) {
    psbt.addOutput({
      address: changeAddress,
      value: changeAmount
    });
  }
  
  return psbt;
}

/**
 * Create reveal transaction PSBT
 */
function createRevealPsbt(params: {
  commitTxid: string;
  inscriptionKeypair: any;
  inscriptionScript: Buffer;
  recipientAddress: string;
  feeRate: number;
  network: bitcoin.Network;
  initialTopUp?: number;
  treasuryAddress?: string;
}): bitcoin.Psbt {
  const {
    commitTxid,
    inscriptionKeypair,
    inscriptionScript,
    recipientAddress,
    feeRate,
    network,
    initialTopUp,
    treasuryAddress
  } = params;
  
  const psbt = new bitcoin.Psbt({ network });
  
  // Add commit output as input
  psbt.addInput({
    hash: commitTxid,
    index: 0,
    witnessUtxo: {
      script: inscriptionKeypair.output,
      value: calculateInscriptionFee(inscriptionScript.length, feeRate)
    },
    tapInternalKey: inscriptionKeypair.publicKey.slice(1),
    tapLeafScript: [{
      leafVersion: 0xc0,
      script: inscriptionScript,
      controlBlock: inscriptionKeypair.witness![inscriptionKeypair.witness!.length - 1]
    }]
  });
  
  // Add inscription output (to recipient)
  psbt.addOutput({
    address: recipientAddress,
    value: 546 // Dust limit for inscription
  });
  
  // Add initial top-up if requested
  if (initialTopUp && treasuryAddress) {
    psbt.addOutput({
      address: treasuryAddress,
      value: initialTopUp
    });
  }
  
  return psbt;
}

/**
 * Helper functions
 */
function getEstimatedTxid(psbt: bitcoin.Psbt): string {
  // This is a placeholder - actual implementation would calculate expected txid
  return Buffer.from(Math.random().toString()).toString('hex').slice(0, 64);
}

function calculatePsbtFee(psbt: bitcoin.Psbt): number {
  // Simplified fee calculation
  const inputCount = psbt.inputCount;
  const outputCount = psbt.txOutputs.length;
  const estimatedSize = 100 + (inputCount * 150) + (outputCount * 50);
  return estimatedSize * 10; // 10 sats/vByte
}
```

### Step 3: Create API Endpoints

**File:** `server/src/routes/inscriptions.ts`

```typescript
/**
 * @fileoverview API routes for inscription operations
 * @module routes/inscriptions
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { createInscriptionPsbt } from '../services/inscription/inscriptionPsbt';
import { getOrdinalsClient } from '../services/ordinals';
import { broadcastTransaction } from '../services/bitcoin';

const router = Router();

/**
 * Create PSBT for new membership card inscription
 */
router.post('/create-psbt',
  authenticateJWT,
  [
    body('utxos').isArray().notEmpty(),
    body('recipientAddress').isString().notEmpty(),
    body('changeAddress').isString().notEmpty(),
    body('initialTopUp').optional().isInt({ min: 0 }),
    body('feeRate').optional().isInt({ min: 1 }).default(10)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { 
        utxos, 
        recipientAddress, 
        changeAddress, 
        initialTopUp,
        feeRate
      } = req.body;
      
      // Load inscription template
      const templatePath = path.join(__dirname, '../../templates/inscription/membershipCard.html');
      const inscriptionContent = await fs.promises.readFile(templatePath, 'utf8');
      
      // Replace treasury address placeholder
      const finalContent = inscriptionContent.replace(
        'window.TREASURY_ADDR = "tb1q..."',
        `window.TREASURY_ADDR = "${process.env.TREASURY_ADDRESS}"`
      );
      
      // Create inscription PSBTs
      const result = await createInscriptionPsbt({
        utxos,
        inscriptionContent: finalContent,
        recipientAddress,
        changeAddress,
        feeRate,
        initialTopUp,
        treasuryAddress: initialTopUp ? process.env.TREASURY_ADDRESS : undefined
      });
      
      // Return PSBTs for wallet signing
      res.json({
        success: true,
        commitPsbt: result.commitPsbt.toBase64(),
        revealPsbt: result.revealPsbt.toBase64(),
        fees: {
          commit: result.commitTxFee,
          reveal: result.revealTxFee,
          total: result.totalFee
        },
        estimatedInscriptionId: result.estimatedInscriptionId
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Broadcast signed inscription transactions
 */
router.post('/broadcast',
  authenticateJWT,
  [
    body('signedCommitTx').isString().notEmpty(),
    body('signedRevealTx').isString().notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { signedCommitTx, signedRevealTx } = req.body;
      
      // Broadcast commit transaction first
      const commitTxid = await broadcastTransaction(signedCommitTx);
      
      // Wait for commit to be in mempool
      await waitForMempool(commitTxid);
      
      // Broadcast reveal transaction
      const revealTxid = await broadcastTransaction(signedRevealTx);
      
      // Calculate inscription ID
      const inscriptionId = `${revealTxid}i0`;
      
      // Store inscription record
      await storeInscriptionRecord({
        inscriptionId,
        owner: req.user.address,
        commitTxid,
        revealTxid,
        createdAt: new Date()
      });
      
      res.json({
        success: true,
        inscriptionId,
        commitTxid,
        revealTxid
      });
      
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Check inscription status
 */
router.get('/status/:inscriptionId',
  async (req, res, next) => {
    try {
      const { inscriptionId } = req.params;
      
      // Validate format
      if (!/^[a-f0-9]{64}i\d+$/.test(inscriptionId)) {
        return res.status(400).json({ error: 'Invalid inscription ID format' });
      }
      
      // Check ordinals API
      const client = getOrdinalsClient();
      const inscription = await client.getInscription(inscriptionId);
      
      if (!inscription.success) {
        return res.status(404).json({ error: 'Inscription not found' });
      }
      
      res.json({
        success: true,
        inscription: inscription.data,
        confirmed: inscription.data.genesis_height > 0
      });
      
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### Step 4: Create PSBT Debug Interface

**File:** `client/src/pages/PsbtDebug.tsx`

```typescript
import React, { useState } from 'react';
import * as bitcoin from 'bitcoinjs-lib';

interface DecodedPsbt {
  inputs: any[];
  outputs: any[];
  fee?: number;
  valid: boolean;
  error?: string;
}

export const PsbtDebug: React.FC = () => {
  const [psbtInput, setPsbtInput] = useState('');
  const [decodedPsbt, setDecodedPsbt] = useState<DecodedPsbt | null>(null);
  const [testParams, setTestParams] = useState({
    utxos: [{
      txid: '0'.repeat(64),
      vout: 0,
      value: 100000,
      scriptPubKey: '00145' + '0'.repeat(38)
    }],
    recipientAddress: 'tb1qtest...',
    changeAddress: 'tb1qchange...',
    initialTopUp: 50000,
    feeRate: 10
  });

  const decodePsbt = () => {
    try {
      const network = bitcoin.networks.testnet;
      const psbt = bitcoin.Psbt.fromBase64(psbtInput, { network });
      
      const decoded: DecodedPsbt = {
        inputs: [],
        outputs: [],
        valid: true
      };
      
      // Decode inputs
      for (let i = 0; i < psbt.inputCount; i++) {
        const input = psbt.data.inputs[i];
        decoded.inputs.push({
          index: i,
          txid: input.nonWitnessUtxo ? 
            bitcoin.Transaction.fromBuffer(input.nonWitnessUtxo).getId() :
            'Unknown',
          value: input.witnessUtxo?.value || 0
        });
      }
      
      // Decode outputs
      psbt.txOutputs.forEach((output, i) => {
        decoded.outputs.push({
          index: i,
          value: output.value,
          address: output.address || 'Script output',
          script: output.script.toString('hex')
        });
      });
      
      // Calculate fee if possible
      const totalIn = decoded.inputs.reduce((sum, inp) => sum + inp.value, 0);
      const totalOut = decoded.outputs.reduce((sum, out) => sum + out.value, 0);
      if (totalIn > 0) {
        decoded.fee = totalIn - totalOut;
      }
      
      setDecodedPsbt(decoded);
    } catch (error: any) {
      setDecodedPsbt({
        inputs: [],
        outputs: [],
        valid: false,
        error: error.message
      });
    }
  };

  const createTestPsbt = async () => {
    try {
      const response = await fetch('/api/inscriptions/create-psbt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(testParams)
      });
      
      const result = await response.json();
      if (result.success) {
        setPsbtInput(result.commitPsbt);
        decodePsbt();
      }
    } catch (error) {
      console.error('Failed to create test PSBT:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">PSBT Debug Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Parameters */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Initial Top-up (sats)
              </label>
              <input
                type="number"
                value={testParams.initialTopUp}
                onChange={(e) => setTestParams({
                  ...testParams,
                  initialTopUp: parseInt(e.target.value)
                })}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Fee Rate (sats/vByte)
              </label>
              <input
                type="number"
                value={testParams.feeRate}
                onChange={(e) => setTestParams({
                  ...testParams,
                  feeRate: parseInt(e.target.value)
                })}
                className="input-field"
              />
            </div>
            
            <button
              onClick={createTestPsbt}
              className="btn-primary w-full"
            >
              Create Test PSBT
            </button>
          </div>
        </div>
        
        {/* PSBT Decoder */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">PSBT Decoder</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                PSBT (Base64)
              </label>
              <textarea
                value={psbtInput}
                onChange={(e) => setPsbtInput(e.target.value)}
                className="input-field font-mono text-xs"
                rows={6}
                placeholder="Paste PSBT here..."
              />
            </div>
            
            <button
              onClick={decodePsbt}
              className="btn-secondary w-full"
            >
              Decode PSBT
            </button>
            
            {decodedPsbt && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Decoded Result</h3>
                
                {decodedPsbt.valid ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Inputs:</strong> {decodedPsbt.inputs.length}
                    </div>
                    <div>
                      <strong>Outputs:</strong> {decodedPsbt.outputs.length}
                    </div>
                    {decodedPsbt.fee && (
                      <div>
                        <strong>Fee:</strong> {decodedPsbt.fee} sats
                      </div>
                    )}
                    
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold">
                        Full Details
                      </summary>
                      <pre className="mt-2 text-xs overflow-x-auto">
                        {JSON.stringify(decodedPsbt, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="text-red-600">
                    Error: {decodedPsbt.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Technical Specifications

### Ordinals Inscription Format
```
OP_FALSE
OP_IF
  OP_PUSH "ord"
  OP_1
  OP_PUSH "text/html;charset=utf-8"
  OP_0
  OP_PUSH <html_content>
OP_ENDIF
```

### PSBT Structure for Inscriptions
1. **Commit Transaction**
   - Inputs: User's UTXOs
   - Outputs: 
     - Inscription funding output (P2TR)
     - Change output (if needed)

2. **Reveal Transaction**
   - Inputs: Commit transaction output 0
   - Outputs:
     - Inscription to recipient (546 sats)
     - Initial top-up to treasury (optional)

### Fee Calculation Formula
```
Total Fee = Commit Fee + Reveal Fee + 10% buffer
Commit Fee = (150 + inputs * 100) * feeRate
Reveal Fee = (200 + inscriptionSize) * feeRate
```

---

## Testing Approach

### Unit Tests
```typescript
describe('InscriptionPsbt', () => {
  it('should create valid inscription envelope', () => {
    const content = '<html>Test</html>';
    const envelope = buildInscriptionScript({
      contentType: 'text/html;charset=utf-8',
      content: Buffer.from(content)
    });
    
    // Verify envelope structure
    expect(envelope.toString('hex')).toContain('6f7264'); // "ord"
  });
  
  it('should calculate correct fees', () => {
    const fee = calculateInscriptionFee(5000, 10);
    expect(fee).toBeGreaterThan(50000); // Reasonable minimum
    expect(fee).toBeLessThan(100000); // Reasonable maximum
  });
  
  it('should handle large inscriptions', () => {
    const largeContent = 'x'.repeat(10000);
    const envelope = buildInscriptionScript({
      contentType: 'text/plain',
      content: Buffer.from(largeContent)
    });
    
    // Should chunk content properly
    expect(envelope.length).toBeGreaterThan(10000);
  });
});
```

### Integration Tests
1. Create test PSBT with mock data
2. Verify PSBT structure matches ordinals requirements
3. Test with Unisat wallet on testnet
4. Verify inscription appears in ordinals explorer

### Manual Testing Checklist
- [ ] Create PSBT with minimum funding
- [ ] Create PSBT with initial top-up
- [ ] Test with multiple UTXOs
- [ ] Test with high fee rates
- [ ] Test with large inscription content
- [ ] Verify Unisat can sign the PSBT
- [ ] Verify inscription is recognized by ord

---

## Common Pitfalls to Avoid

### Critical Mistakes
1. **Incorrect Script Structure**
   - ❌ Wrong opcode order
   - ❌ Missing protocol identifier
   - ❌ Incorrect content type format
   - ✅ Follow ord standards exactly

2. **Fee Calculation Errors**
   - ❌ Underestimating witness data size
   - ❌ Not accounting for reveal transaction
   - ✅ Include 10% buffer for safety
   - ✅ Test with actual transactions

3. **PSBT Field Errors**
   - ❌ Missing witness UTXO data
   - ❌ Incorrect taproot fields
   - ✅ Include all required fields
   - ✅ Test with target wallet

4. **Output Ordering**
   - ❌ Inscription output not first
   - ❌ Change before inscription
   - ✅ Follow ordinals conventions
   - ✅ Inscription output = 546 sats

### Security Considerations
1. **Input Validation**
   - Validate all addresses
   - Check UTXO ownership
   - Verify fee rates are reasonable

2. **Error Handling**
   - Don't expose internal errors
   - Log detailed errors securely
   - Return user-friendly messages

---

## Deliverables

### Required Files
1. `envelopeBuilder.ts` - Inscription envelope creation
2. `inscriptionPsbt.ts` - PSBT generation service
3. `inscriptions.ts` - API routes
4. `PsbtDebug.tsx` - Debug interface
5. `inscription.test.ts` - Unit tests

### Documentation
1. API endpoint documentation
2. PSBT structure diagrams
3. Fee calculation examples
4. Integration test results

### Validation Checklist
- [ ] Inscription envelope follows ord standards
- [ ] PSBTs are valid and signable
- [ ] Fees are calculated correctly
- [ ] Works with Unisat wallet
- [ ] Inscriptions appear in explorer
- [ ] Initial top-up works correctly
- [ ] Error handling is comprehensive
- [ ] All tests pass

---

## Next Phase

After successful PSBT generation:
1. Implement user interface for card creation
2. Add transaction monitoring
3. Create success/error handling flows
4. Test end-to-end on testnet

---

*This document provides a comprehensive plan for implementing PSBT generation for ordinals inscriptions. Proper implementation of this phase is critical as it directly interfaces with the Bitcoin blockchain and user funds.*