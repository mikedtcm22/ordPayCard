import { networks, payments, address, Transaction } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { sumOutputsToAddress } from '../sumToCreator';

const ECPair = ECPairFactory(ecc);

function makeKeyPair() {
  return ECPair.makeRandom({ network: networks.testnet });
}

function toBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}

function xOnly(pubkeyU8: Uint8Array): Buffer {
  const buf = Buffer.from(pubkeyU8);
  return buf.length === 33 ? buf.slice(1, 33) : buf;
}

function buildTxHex(outputs: Array<{ script: Buffer; value: number }>): string {
  // Minimal TX with a single dummy input and provided outputs
  const tx = new Transaction();
  tx.version = 2;
  // Dummy prevout (32 bytes of 0x01 just to be valid hex) and vout 0
  const prevTxId = Buffer.alloc(32, 1);
  tx.addInput(prevTxId, 0xffffffff); // vout set to 0xffffffff to avoid standardness checks
  for (const out of outputs) {
    tx.addOutput(out.script, out.value);
  }
  return tx.toHex();
}

describe('sumOutputsToAddress (A2)', () => {
  test('sums P2PKH outputs to creator and ignores others', () => {
    const keyCreator = makeKeyPair();
    const keyOther = makeKeyPair();
    const creatorAddr = payments.p2pkh({ pubkey: toBuffer(keyCreator.publicKey), network: networks.testnet }).address!;
    const otherAddr = payments.p2pkh({ pubkey: toBuffer(keyOther.publicKey), network: networks.testnet }).address!;

    const scriptCreator = address.toOutputScript(creatorAddr, networks.testnet);
    const scriptOther = address.toOutputScript(otherAddr, networks.testnet);

    const hex = buildTxHex([
      { script: scriptCreator, value: 1500 },
      { script: scriptOther, value: 2500 },
      { script: scriptCreator, value: 500 },
    ]);

    const sum = sumOutputsToAddress(hex, creatorAddr, 'testnet');
    expect(sum).toBe(2000n);
  });

  test('sums P2WPKH outputs to creator', () => {
    const keyCreator = makeKeyPair();
    const creatorAddr = payments.p2wpkh({ pubkey: toBuffer(keyCreator.publicKey), network: networks.testnet }).address!;
    const otherAddr = payments.p2wpkh({ pubkey: toBuffer(makeKeyPair().publicKey), network: networks.testnet }).address!;

    const scriptCreator = address.toOutputScript(creatorAddr, networks.testnet);
    const scriptOther = address.toOutputScript(otherAddr, networks.testnet);

    const hex = buildTxHex([
      { script: scriptOther, value: 1000 },
      { script: scriptCreator, value: 3000 },
    ]);

    const sum = sumOutputsToAddress(hex, creatorAddr, 'testnet');
    expect(sum).toBe(3000n);
  });

  test('sums P2TR outputs to creator', () => {
    const keyCreator = makeKeyPair();
    const internalPubkey = xOnly(keyCreator.publicKey);
    const creatorAddr = payments.p2tr({ internalPubkey, network: networks.testnet }).address!;
    const otherAddr = payments.p2tr({ internalPubkey: xOnly(makeKeyPair().publicKey), network: networks.testnet }).address!;

    const scriptCreator = address.toOutputScript(creatorAddr, networks.testnet);
    const scriptOther = address.toOutputScript(otherAddr, networks.testnet);

    const hex = buildTxHex([
      { script: scriptOther, value: 1111 },
      { script: scriptCreator, value: 2222 },
      { script: scriptCreator, value: 3333 },
    ]);

    const sum = sumOutputsToAddress(hex, creatorAddr, 'testnet');
    expect(sum).toBe(5555n);
  });

  test('returns 0n when no outputs match the creator address', () => {
    const keyCreator = makeKeyPair();
    const nonMatchAddr = payments.p2wpkh({ pubkey: toBuffer(makeKeyPair().publicKey), network: networks.testnet }).address!;
    const creatorAddr = payments.p2pkh({ pubkey: toBuffer(keyCreator.publicKey), network: networks.testnet }).address!;

    const hex = buildTxHex([
      { script: address.toOutputScript(nonMatchAddr, networks.testnet), value: 777 },
      { script: address.toOutputScript(nonMatchAddr, networks.testnet), value: 888 },
    ]);

    const sum = sumOutputsToAddress(hex, creatorAddr, 'testnet');
    expect(sum).toBe(0n);
  });

  test('mixed output types: sums only exact matches for creator across P2PKH/P2WPKH/P2TR', () => {
    // Creator is P2WPKH; include other types which must be ignored
    const keyCreator = makeKeyPair();
    const creatorAddr = payments.p2wpkh({ pubkey: toBuffer(keyCreator.publicKey), network: networks.testnet }).address!;

    const p2pkhAddr = payments.p2pkh({ pubkey: toBuffer(makeKeyPair().publicKey), network: networks.testnet }).address!;
    const p2trAddr = payments.p2tr({ internalPubkey: xOnly(makeKeyPair().publicKey), network: networks.testnet }).address!;

    const scriptCreator = address.toOutputScript(creatorAddr, networks.testnet);
    const scriptP2pkh = address.toOutputScript(p2pkhAddr, networks.testnet);
    const scriptP2tr = address.toOutputScript(p2trAddr, networks.testnet);

    const hex = buildTxHex([
      { script: scriptP2pkh, value: 999 },
      { script: scriptCreator, value: 2000 },
      { script: scriptP2tr, value: 1234 },
      { script: scriptCreator, value: 1 },
    ]);

    const sum = sumOutputsToAddress(hex, creatorAddr, 'testnet');
    expect(sum).toBe(2001n);
  });

  test('supports signet and regtest networks (mapped to testnet)', () => {
    const keyCreator = makeKeyPair();
    const creatorAddr = payments.p2wpkh({ pubkey: toBuffer(keyCreator.publicKey), network: networks.testnet }).address!;
    const scriptCreator = address.toOutputScript(creatorAddr, networks.testnet);
    const hex = buildTxHex([
      { script: scriptCreator, value: 3210 },
    ]);

    expect(sumOutputsToAddress(hex, creatorAddr, 'signet')).toBe(3210n);
    expect(sumOutputsToAddress(hex, creatorAddr, 'regtest')).toBe(3210n);
  });

  test('throws on invalid raw transaction hex', () => {
    expect(() => sumOutputsToAddress('not-hex', 'tb1qxy', 'testnet' as any)).toThrow('Invalid raw transaction hex');
  });
});


