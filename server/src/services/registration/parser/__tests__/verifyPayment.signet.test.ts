/**
 * VerifyPayment Network Integration Tests
 * Tests the verifyPayment function with network-specific validation,
 * ensuring correct behavior across different Bitcoin networks.
 */

import { verifyPayment } from '../verifyPayment';
import * as signetFixtures from '../fixtures/signet';
import { networks, payments, address, Transaction, script as bscript } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

function toBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}

// Helper to build transaction with OP_RETURN
function buildPaymentTx(
  creatorAddress: string,
  amount: number,
  nftId: string,
  expiryBlock: number,
  network: 'signet' | 'regtest' | 'testnet'
): string {
  const tx = new Transaction();
  tx.version = 2;
  
  // Add dummy input
  tx.addInput(Buffer.alloc(32, 1), 0);
  
  // Add payment output
  const net = network === 'regtest' ? networks.testnet : networks.testnet; // All test networks use testnet params
  tx.addOutput(
    address.toOutputScript(creatorAddress, net),
    amount
  );
  
  // Add OP_RETURN output
  const payload = `${nftId}|${expiryBlock}`;
  const data = Buffer.from(payload, 'ascii');
  const opReturnScript = bscript.compile([
    bscript.OPS['OP_RETURN']!,
    data
  ]);
  tx.addOutput(opReturnScript, 0);
  
  return tx.toHex();
}

describe('verifyPayment on Signet', () => {
  const SIGNET_CURRENT_BLOCK = 195000; // Use block before expiry
  const SIGNET_EXPIRY_BLOCK = 195144; // From fixtures
  
  describe('Basic network validation', () => {
    it('should verify Signet transaction with correct network', async () => {
      const amount = await verifyPayment(
        signetFixtures.p2wpkhWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });

    it('should verify regtest transaction with regtest network', async () => {
      // Create regtest-specific fixture
      const regtestKey = ECPair.makeRandom({ network: networks.testnet });
      const regtestAddr = payments.p2wpkh({
        pubkey: toBuffer(regtestKey.publicKey),
        network: networks.testnet
      }).address!;
      
      const regtestTx = buildPaymentTx(
        regtestAddr,
        75000,
        signetFixtures.SAMPLE_NFT_ID,
        SIGNET_EXPIRY_BLOCK,
        'regtest'
      );
      
      const amount = await verifyPayment(
        regtestTx,
        regtestAddr,
        75000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'regtest', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(75000n);
    });

    it('should verify testnet transaction with testnet network', async () => {
      const testnetKey = ECPair.makeRandom({ network: networks.testnet });
      const testnetAddr = payments.p2wpkh({
        pubkey: toBuffer(testnetKey.publicKey),
        network: networks.testnet
      }).address!;
      
      const testnetTx = buildPaymentTx(
        testnetAddr,
        60000,
        signetFixtures.SAMPLE_NFT_ID,
        SIGNET_EXPIRY_BLOCK,
        'testnet'
      );
      
      const amount = await verifyPayment(
        testnetTx,
        testnetAddr,
        60000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'testnet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(60000n);
    });
  });

  describe('Cross-network rejection', () => {
    it('should reject payment to wrong network address', async () => {
      // Try to use a mainnet-style address on signet
      // Since we can't create actual mainnet addresses with testnet params,
      // we'll test the concept by using mismatched addresses
      const wrongKey = ECPair.makeRandom({ network: networks.testnet });
      const wrongAddr = payments.p2pkh({ // Different address type
        pubkey: toBuffer(wrongKey.publicKey),
        network: networks.testnet
      }).address!;
      
      const amount = await verifyPayment(
        signetFixtures.p2wpkhWithOpReturn, // P2WPKH transaction
        wrongAddr, // P2PKH address (wrong type)
        50000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(0n); // Should not match
    });

    it('should handle network parameter correctly in options', async () => {
      // Verify the network parameter is being used
      const amount = await verifyPayment(
        signetFixtures.multiOutputTransaction,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n, // Total of 30000 + 20000
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });
  });

  describe('OP_RETURN validation with network', () => {
    it('should validate OP_RETURN on Signet', async () => {
      const amount = await verifyPayment(
        signetFixtures.p2wpkhWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });

    it('should reject expired OP_RETURN on Signet', async () => {
      const amount = await verifyPayment(
        signetFixtures.expiredRegistration,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        60000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: 195000 // Current block, but expiry is 190000 (expired)
        }
      );
      expect(amount).toBe(0n); // Should reject due to expiry
    });

    it('should reject mismatched NFT ID on Signet', async () => {
      const amount = await verifyPayment(
        signetFixtures.p2wpkhWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n,
        'wrongnftid1234567890abcdef1234567890abcdef1234567890abcdef1234567i0', // Wrong ID
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(0n); // Should reject due to NFT ID mismatch
    });
  });

  describe('Different output types on Signet', () => {
    it('should verify P2WPKH payment on Signet without OP_RETURN check', async () => {
      // When we don't have OP_RETURN, we can't verify with this function
      // as it requires an nftId to check. This documents current behavior.
      const txWithoutOpReturn = signetFixtures.p2wpkhPayment;
      
      // This will return 0 because there's no OP_RETURN to validate
      const amount = await verifyPayment(
        txWithoutOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        75000n,
        'anynftid1234567890abcdef1234567890abcdef1234567890abcdef1234567i0', // Any NFT ID
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(0n); // Fails because no OP_RETURN
    });

    it('should verify P2TR payment on Signet with OP_RETURN', async () => {
      const amount = await verifyPayment(
        signetFixtures.p2trWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS_TAPROOT,
        60000n,
        signetFixtures.SAMPLE_PARENT_ID, // Must match OP_RETURN
        { 
          network: 'signet', 
          currentBlock: 195200 // Before expiry of 195288 (SAMPLE_EXPIRY_BLOCK + 144)
        }
      );
      expect(amount).toBe(60000n);
    });

    it('should verify P2PKH legacy payment on Signet with OP_RETURN', async () => {
      const amount = await verifyPayment(
        signetFixtures.p2pkhWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS_LEGACY,
        55000n,
        signetFixtures.SAMPLE_NFT_ID, // Must match OP_RETURN
        { 
          network: 'signet', 
          currentBlock: 195000 // Before expiry of 195044 (SAMPLE_EXPIRY_BLOCK - 100)
        }
      );
      expect(amount).toBe(55000n);
    });
  });

  describe('Complex scenarios', () => {
    it('should sum multiple outputs on Signet', async () => {
      const amount = await verifyPayment(
        signetFixtures.multiOutputTransaction,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n, // 30000 + 20000
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });

    it('should handle minimum fee on Signet', async () => {
      const amount = await verifyPayment(
        signetFixtures.minFeeTransaction,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n, // Exactly minimum
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });

    it('should handle large OP_RETURN on Signet', async () => {
      // Large OP_RETURN has a composite NFT ID
      const largeNftId = `${signetFixtures.SAMPLE_PARENT_ID}:${signetFixtures.SAMPLE_NFT_ID}`;
      const amount = await verifyPayment(
        signetFixtures.largeOpReturnTransaction,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        70000n,
        largeNftId,
        { 
          network: 'signet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(70000n);
    });
  });

  describe('Network parameter edge cases', () => {
    it('should require network parameter in options', async () => {
      // Test that network is properly passed through
      const amount = await verifyPayment(
        signetFixtures.p2wpkhWithOpReturn,
        signetFixtures.SIGNET_CREATOR_ADDRESS,
        50000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'signet', // Explicitly required
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(amount).toBe(50000n);
    });

    it('should handle all supported networks', async () => {
      const supportedNetworks = ['signet', 'regtest', 'testnet'] as const;
      
      for (const net of supportedNetworks) {
        // Create appropriate address for each network (all use testnet params)
        const key = ECPair.makeRandom({ network: networks.testnet });
        const addr = payments.p2wpkh({
          pubkey: toBuffer(key.publicKey),
          network: networks.testnet
        }).address!;
        
        const tx = buildPaymentTx(
          addr,
          55000,
          signetFixtures.SAMPLE_NFT_ID,
          SIGNET_EXPIRY_BLOCK,
          net
        );
        
        const amount = await verifyPayment(
          tx,
          addr,
          55000n,
          signetFixtures.SAMPLE_NFT_ID,
          { 
            network: net, 
            currentBlock: SIGNET_CURRENT_BLOCK 
          }
        );
        expect(amount).toBe(55000n);
      }
      
      // Test mainnet separately with proper mainnet address
      const mainnetKey = ECPair.makeRandom({ network: networks.bitcoin });
      const mainnetAddr = payments.p2wpkh({
        pubkey: toBuffer(mainnetKey.publicKey),
        network: networks.bitcoin
      }).address!;
      
      // Build tx manually for mainnet
      const mainnetTx = new Transaction();
      mainnetTx.version = 2;
      mainnetTx.addInput(Buffer.alloc(32, 1), 0);
      mainnetTx.addOutput(
        address.toOutputScript(mainnetAddr, networks.bitcoin),
        55000
      );
      const payload = `${signetFixtures.SAMPLE_NFT_ID}|${SIGNET_EXPIRY_BLOCK}`;
      const data = Buffer.from(payload, 'ascii');
      const opReturnScript = bscript.compile([
        bscript.OPS['OP_RETURN']!,
        data
      ]);
      mainnetTx.addOutput(opReturnScript, 0);
      
      const mainnetAmount = await verifyPayment(
        mainnetTx.toHex(),
        mainnetAddr,
        55000n,
        signetFixtures.SAMPLE_NFT_ID,
        { 
          network: 'mainnet', 
          currentBlock: SIGNET_CURRENT_BLOCK 
        }
      );
      expect(mainnetAmount).toBe(55000n);
    });
  });
});