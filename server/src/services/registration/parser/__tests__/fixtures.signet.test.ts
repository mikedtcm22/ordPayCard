/**
 * Signet Fixtures Tests
 * Tests the validity and structure of Signet transaction fixtures,
 * ensuring they accurately represent real Signet network transactions.
 */

import { Transaction } from 'bitcoinjs-lib';
import * as signetFixtures from '../fixtures/signet';
import { parseOpReturn } from '../opReturn';
import { sumOutputsToAddress } from '../sumToCreator';

// Helper to validate Signet transaction structure
function isValidSignetTransaction(txHex: string): boolean {
  try {
    const tx = Transaction.fromHex(txHex);
    // Basic validation - has inputs and outputs
    return tx.ins.length > 0 && tx.outs.length > 0;
  } catch {
    return false;
  }
}

// Helper to extract OP_RETURN data
function extractOpReturn(txHex: string): { nftId: string; expiryBlock: number } | null {
  const parsed = parseOpReturn(txHex);
  if (!parsed) return null;
  return {
    nftId: parsed.nftId,
    expiryBlock: parsed.expiryBlock
  };
}

describe('Signet fixtures', () => {
  describe('P2WPKH transactions', () => {
    it('should have valid Signet P2WPKH transaction', () => {
      const tx = signetFixtures.p2wpkhWithOpReturn;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      // Should have OP_RETURN with valid format
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toMatchObject({
        nftId: expect.stringMatching(/^[a-f0-9]{64}i\d+$/),
        expiryBlock: expect.any(Number)
      });
    });

    it('should have P2WPKH payment to creator', () => {
      const tx = signetFixtures.p2wpkhPayment;
      const creatorAddress = signetFixtures.SIGNET_CREATOR_ADDRESS;
      
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const amount = sumOutputsToAddress(tx, creatorAddress, 'signet');
      expect(amount).toBeGreaterThan(0n);
    });
  });

  describe('P2TR transactions', () => {
    it('should have valid Signet P2TR transaction', () => {
      const tx = signetFixtures.p2trWithOpReturn;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      // Should have OP_RETURN with valid format
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toMatchObject({
        nftId: expect.stringMatching(/^[a-f0-9]{64}i\d+$/),
        expiryBlock: expect.any(Number)
      });
    });

    it('should have P2TR payment to creator', () => {
      const tx = signetFixtures.p2trPayment;
      const creatorAddress = signetFixtures.SIGNET_CREATOR_ADDRESS_TAPROOT;
      
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const amount = sumOutputsToAddress(tx, creatorAddress, 'signet');
      expect(amount).toBeGreaterThan(0n);
    });
  });

  describe('P2PKH legacy transactions', () => {
    it('should have valid Signet P2PKH transaction', () => {
      const tx = signetFixtures.p2pkhWithOpReturn;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      // Should have OP_RETURN with valid format
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toMatchObject({
        nftId: expect.stringMatching(/^[a-f0-9]{64}i\d+$/),
        expiryBlock: expect.any(Number)
      });
    });

    it('should have P2PKH payment to creator', () => {
      const tx = signetFixtures.p2pkhPayment;
      const creatorAddress = signetFixtures.SIGNET_CREATOR_ADDRESS_LEGACY;
      
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const amount = sumOutputsToAddress(tx, creatorAddress, 'signet');
      expect(amount).toBeGreaterThan(0n);
    });
  });

  describe('Complex transactions', () => {
    it('should have transaction with multiple outputs', () => {
      const tx = signetFixtures.multiOutputTransaction;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const parsed = Transaction.fromHex(tx);
      expect(parsed.outs.length).toBeGreaterThan(2);
      
      // Should have both payment and OP_RETURN
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toBeTruthy();
      
      const amount = sumOutputsToAddress(
        tx, 
        signetFixtures.SIGNET_CREATOR_ADDRESS, 
        'signet'
      );
      expect(amount).toBeGreaterThan(0n);
    });

    it('should have transaction with multiple inputs', () => {
      const tx = signetFixtures.multiInputTransaction;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const parsed = Transaction.fromHex(tx);
      expect(parsed.ins.length).toBeGreaterThan(1);
    });
  });

  describe('Edge cases', () => {
    it('should have transaction with minimum fee', () => {
      const tx = signetFixtures.minFeeTransaction;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const amount = sumOutputsToAddress(
        tx, 
        signetFixtures.SIGNET_CREATOR_ADDRESS, 
        'signet'
      );
      // Minimum registration fee (50000 sats)
      expect(amount).toBe(50000n);
    });

    it('should have transaction with large OP_RETURN', () => {
      const tx = signetFixtures.largeOpReturnTransaction;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toBeTruthy();
      expect(opReturn!.nftId.length).toBeGreaterThan(64);
    });

    it('should have expired registration transaction', () => {
      const tx = signetFixtures.expiredRegistration;
      expect(isValidSignetTransaction(tx)).toBe(true);
      
      const opReturn = extractOpReturn(tx);
      expect(opReturn).toBeTruthy();
      // Block height in the past
      expect(opReturn!.expiryBlock).toBeLessThan(200000);
    });
  });

  describe('Fixture metadata', () => {
    it('should export creator addresses', () => {
      expect(signetFixtures.SIGNET_CREATOR_ADDRESS).toMatch(/^tb1/);
      expect(signetFixtures.SIGNET_CREATOR_ADDRESS_TAPROOT).toMatch(/^tb1p/);
      expect(signetFixtures.SIGNET_CREATOR_ADDRESS_LEGACY).toMatch(/^[mn2]/);
    });

    it('should export sample NFT IDs', () => {
      expect(signetFixtures.SAMPLE_NFT_ID).toMatch(/^[a-f0-9]{64}i\d+$/);
      expect(signetFixtures.SAMPLE_PARENT_ID).toMatch(/^[a-f0-9]{64}i\d+$/);
    });

    it('should export block heights', () => {
      expect(signetFixtures.SAMPLE_BLOCK_HEIGHT).toBeGreaterThan(0);
      expect(signetFixtures.SAMPLE_EXPIRY_BLOCK).toBeGreaterThan(
        signetFixtures.SAMPLE_BLOCK_HEIGHT
      );
    });
  });
});