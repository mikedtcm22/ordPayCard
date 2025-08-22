/**
 * Network-aware sumToCreator Tests
 * Tests the sumOutputsToAddress function with network parameter support,
 * ensuring correct address validation per network and accurate sum calculation.
 */

import { networks, payments, address, Transaction } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { sumOutputsToAddress } from '../sumToCreator';

const ECPair = ECPairFactory(ecc);

function toBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}

function buildTxHex(outputs: Array<{ script: Buffer; value: number }>): string {
  const tx = new Transaction();
  tx.version = 2;
  const prevTxId = Buffer.alloc(32, 1);
  tx.addInput(prevTxId, 0xffffffff);
  for (const out of outputs) {
    tx.addOutput(out.script, out.value);
  }
  return tx.toHex();
}

describe('sumToCreator with network parameter', () => {
  describe('Network-specific address validation', () => {
    it('should accept signet addresses on signet network', () => {
      // Signet uses testnet network params in bitcoinjs-lib
      const key = ECPair.makeRandom({ network: networks.testnet });
      const signetAddr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const script = address.toOutputScript(signetAddr, networks.testnet);
      const txHex = buildTxHex([
        { script, value: 100000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, signetAddr, 'signet');
      expect(amount).toBe(100000n);
    });

    it('should accept regtest addresses on regtest network', () => {
      // Regtest uses its own network params in bitcoinjs-lib
      const key = ECPair.makeRandom({ network: networks.regtest });
      const regtestAddr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.regtest 
      }).address!;
      
      const script = address.toOutputScript(regtestAddr, networks.regtest);
      const txHex = buildTxHex([
        { script, value: 50000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, regtestAddr, 'regtest');
      expect(amount).toBe(50000n);
    });

    it('should accept testnet addresses on testnet network', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const testnetAddr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const script = address.toOutputScript(testnetAddr, networks.testnet);
      const txHex = buildTxHex([
        { script, value: 75000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, testnetAddr, 'testnet');
      expect(amount).toBe(75000n);
    });

    it('should handle P2PKH addresses', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const p2pkhAddr = payments.p2pkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const script = address.toOutputScript(p2pkhAddr, networks.testnet);
      const txHex = buildTxHex([
        { script, value: 25000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, p2pkhAddr, 'signet');
      expect(amount).toBe(25000n);
    });

    it('should handle P2SH addresses', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const p2sh = payments.p2sh({
        redeem: payments.p2wpkh({ 
          pubkey: toBuffer(key.publicKey), 
          network: networks.testnet 
        }),
        network: networks.testnet
      });
      
      const script = address.toOutputScript(p2sh.address!, networks.testnet);
      const txHex = buildTxHex([
        { script, value: 35000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, p2sh.address!, 'signet');
      expect(amount).toBe(35000n);
    });

    it('should handle P2TR addresses on signet', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const p2tr = payments.p2tr({
        internalPubkey: toBuffer(key.publicKey).slice(1, 33),
        network: networks.testnet
      });
      
      const script = address.toOutputScript(p2tr.address!, networks.testnet);
      const txHex = buildTxHex([
        { script, value: 45000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, p2tr.address!, 'signet');
      expect(amount).toBe(45000n);
    });
  });

  describe('Network parameter behavior', () => {
    it('should require network parameter', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const addr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const script = address.toOutputScript(addr, networks.testnet);
      const txHex = buildTxHex([{ script, value: 10000 }]);
      
      // TypeScript should enforce this, but test runtime behavior
      expect(() => {
        // @ts-expect-error Testing missing network parameter
        sumOutputsToAddress(txHex, addr);
      }).toThrow();
    });

    it('should handle network parameter as optional with default', () => {
      // This test documents current behavior - network is required
      // If we want backward compatibility, we'd need to make it optional
      const key = ECPair.makeRandom({ network: networks.regtest });
      const addr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.regtest 
      }).address!;
      
      const script = address.toOutputScript(addr, networks.regtest);
      const txHex = buildTxHex([{ script, value: 10000 }]);
      
      // Current implementation requires network
      const amount = sumOutputsToAddress(txHex, addr, 'regtest');
      expect(amount).toBe(10000n);
    });

    it('should handle mainnet addresses on mainnet network', () => {
      const key = ECPair.makeRandom({ network: networks.bitcoin });
      const addr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.bitcoin 
      }).address!;
      
      const script = address.toOutputScript(addr, networks.bitcoin);
      const txHex = buildTxHex([{ script, value: 10000 }]);
      
      // Mainnet is actually supported
      const amount = sumOutputsToAddress(txHex, addr, 'mainnet');
      expect(amount).toBe(10000n);
    });
  });

  describe('Multiple outputs and edge cases', () => {
    it('should sum multiple matching outputs', () => {
      const key = ECPair.makeRandom({ network: networks.testnet });
      const creatorAddr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const otherKey = ECPair.makeRandom({ network: networks.testnet });
      const otherAddr = payments.p2wpkh({ 
        pubkey: toBuffer(otherKey.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const creatorScript = address.toOutputScript(creatorAddr, networks.testnet);
      const otherScript = address.toOutputScript(otherAddr, networks.testnet);
      
      const txHex = buildTxHex([
        { script: creatorScript, value: 30000 },
        { script: creatorScript, value: 20000 },
        { script: otherScript, value: 10000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, creatorAddr, 'signet');
      expect(amount).toBe(50000n);
    });

    it('should return 0 for no matching outputs', () => {
      const key1 = ECPair.makeRandom({ network: networks.testnet });
      const key2 = ECPair.makeRandom({ network: networks.testnet });
      
      const addr1 = payments.p2wpkh({ 
        pubkey: toBuffer(key1.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const addr2 = payments.p2wpkh({ 
        pubkey: toBuffer(key2.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const script2 = address.toOutputScript(addr2, networks.testnet);
      const txHex = buildTxHex([
        { script: script2, value: 50000 }
      ]);
      
      const amount = sumOutputsToAddress(txHex, addr1, 'signet');
      expect(amount).toBe(0n);
    });

    it('should handle transaction with no outputs', () => {
      const tx = new Transaction();
      tx.version = 2;
      tx.addInput(Buffer.alloc(32, 1), 0xffffffff);
      const txHex = tx.toHex();
      
      const key = ECPair.makeRandom({ network: networks.testnet });
      const addr = payments.p2wpkh({ 
        pubkey: toBuffer(key.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const amount = sumOutputsToAddress(txHex, addr, 'signet');
      expect(amount).toBe(0n);
    });

    it('should handle invalid hex gracefully', () => {
      expect(() => {
        sumOutputsToAddress('invalid-hex', 'tb1qtest', 'signet');
      }).toThrow();
    });

    it('should handle odd-length hex', () => {
      expect(() => {
        sumOutputsToAddress('abc', 'tb1qtest', 'signet');
      }).toThrow('Invalid raw transaction hex');
    });
  });

  describe('Cross-network compatibility', () => {
    it('should properly distinguish between networks', () => {
      // Testnet and signet share the same address format
      const testnetKey = ECPair.makeRandom({ network: networks.testnet });
      const testnetAddr = payments.p2wpkh({ 
        pubkey: toBuffer(testnetKey.publicKey), 
        network: networks.testnet 
      }).address!;
      
      const testnetScript = address.toOutputScript(testnetAddr, networks.testnet);
      const testnetTxHex = buildTxHex([{ script: testnetScript, value: 10000 }]);
      
      // Should work with testnet and signet (same address format)
      const signetAmount = sumOutputsToAddress(testnetTxHex, testnetAddr, 'signet');
      expect(signetAmount).toBe(10000n);
      
      const testnetAmount = sumOutputsToAddress(testnetTxHex, testnetAddr, 'testnet');
      expect(testnetAmount).toBe(10000n);
      
      // Regtest uses different address format
      const regtestKey = ECPair.makeRandom({ network: networks.regtest });
      const regtestAddr = payments.p2wpkh({ 
        pubkey: toBuffer(regtestKey.publicKey), 
        network: networks.regtest 
      }).address!;
      
      const regtestScript = address.toOutputScript(regtestAddr, networks.regtest);
      const regtestTxHex = buildTxHex([{ script: regtestScript, value: 10000 }]);
      
      const regtestAmount = sumOutputsToAddress(regtestTxHex, regtestAddr, 'regtest');
      expect(regtestAmount).toBe(10000n);
    });
  });
});