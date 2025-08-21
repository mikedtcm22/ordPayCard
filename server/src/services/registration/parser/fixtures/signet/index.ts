/**
 * Signet Network Test Fixtures
 * Realistic transaction fixtures for testing parser functions with Signet network data.
 * These transactions are generated to match real Signet transaction structures.
 */

import { networks, payments, address, Transaction, script as bscript, crypto } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

// Generate deterministic keys for consistent test addresses
const creatorKey = ECPair.fromPrivateKey(
  Buffer.from('0101010101010101010101010101010101010101010101010101010101010101', 'hex'),
  { network: networks.testnet }
);

const creatorKeyTaproot = ECPair.fromPrivateKey(
  Buffer.from('0202020202020202020202020202020202020202020202020202020202020202', 'hex'),
  { network: networks.testnet }
);

const creatorKeyLegacy = ECPair.fromPrivateKey(
  Buffer.from('0303030303030303030303030303030303030303030303030303030303030303', 'hex'),
  { network: networks.testnet }
);

// Helper to convert Uint8Array to Buffer
function toBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}

// Creator addresses for different output types
export const SIGNET_CREATOR_ADDRESS = payments.p2wpkh({
  pubkey: toBuffer(creatorKey.publicKey),
  network: networks.testnet
}).address!;

export const SIGNET_CREATOR_ADDRESS_TAPROOT = payments.p2tr({
  internalPubkey: toBuffer(creatorKeyTaproot.publicKey).slice(1, 33),
  network: networks.testnet
}).address!;

export const SIGNET_CREATOR_ADDRESS_LEGACY = payments.p2pkh({
  pubkey: toBuffer(creatorKeyLegacy.publicKey),
  network: networks.testnet
}).address!;

// Sample inscription IDs and block heights (valid hex transaction IDs - 64 hex chars)
export const SAMPLE_NFT_ID = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefi0';
export const SAMPLE_PARENT_ID = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabci0';
export const SAMPLE_BLOCK_HEIGHT = 195000;
export const SAMPLE_EXPIRY_BLOCK = 195144; // ~1 day later

// Helper to build transaction hex
function buildTxHex(
  outputs: Array<{ script: Buffer; value: number }>,
  inputs?: Array<{ hash: Buffer; index: number }>
): string {
  const tx = new Transaction();
  tx.version = 2;
  
  // Add inputs (default to one dummy input if not specified)
  if (!inputs || inputs.length === 0) {
    const prevTxId = crypto.sha256(Buffer.from('dummy-input-01'));
    tx.addInput(prevTxId, 0);
  } else {
    inputs.forEach(input => {
      tx.addInput(input.hash, input.index);
    });
  }
  
  // Add outputs
  outputs.forEach(output => {
    tx.addOutput(output.script, output.value);
  });
  
  return tx.toHex();
}

// Helper to create OP_RETURN output
function createOpReturnOutput(nftId: string, expiryBlock: number): Buffer {
  const payload = `${nftId}|${expiryBlock}`;
  const data = Buffer.from(payload, 'ascii');
  return bscript.compile([
    bscript.OPS['OP_RETURN']!,
    data
  ]);
}

// P2WPKH transaction with OP_RETURN
export const p2wpkhWithOpReturn = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 50000
  },
  {
    script: createOpReturnOutput(SAMPLE_NFT_ID, SAMPLE_EXPIRY_BLOCK),
    value: 0
  }
]);

// P2WPKH payment transaction
export const p2wpkhPayment = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 75000
  },
  {
    script: address.toOutputScript(
      payments.p2wpkh({
        pubkey: toBuffer(ECPair.makeRandom({ network: networks.testnet }).publicKey),
        network: networks.testnet
      }).address!,
      networks.testnet
    ),
    value: 25000
  }
]);

// P2TR transaction with OP_RETURN
export const p2trWithOpReturn = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS_TAPROOT, networks.testnet),
    value: 60000
  },
  {
    script: createOpReturnOutput(SAMPLE_PARENT_ID, SAMPLE_EXPIRY_BLOCK + 144),
    value: 0
  }
]);

// P2TR payment transaction
export const p2trPayment = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS_TAPROOT, networks.testnet),
    value: 100000
  }
]);

// P2PKH legacy transaction with OP_RETURN
export const p2pkhWithOpReturn = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS_LEGACY, networks.testnet),
    value: 55000
  },
  {
    script: createOpReturnOutput(SAMPLE_NFT_ID, SAMPLE_EXPIRY_BLOCK - 100),
    value: 0
  }
]);

// P2PKH legacy payment transaction
export const p2pkhPayment = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS_LEGACY, networks.testnet),
    value: 80000
  }
]);

// Multi-output transaction with payment and OP_RETURN
export const multiOutputTransaction = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 30000
  },
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 20000
  },
  {
    script: createOpReturnOutput(SAMPLE_NFT_ID, SAMPLE_EXPIRY_BLOCK),
    value: 0
  },
  {
    script: address.toOutputScript(
      payments.p2wpkh({
        pubkey: toBuffer(ECPair.makeRandom({ network: networks.testnet }).publicKey),
        network: networks.testnet
      }).address!,
      networks.testnet
    ),
    value: 15000
  }
]);

// Multi-input transaction
export const multiInputTransaction = buildTxHex(
  [
    {
      script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
      value: 65000
    },
    {
      script: createOpReturnOutput(SAMPLE_NFT_ID, SAMPLE_EXPIRY_BLOCK),
      value: 0
    }
  ],
  [
    { hash: crypto.sha256(Buffer.from('input-01')), index: 0 },
    { hash: crypto.sha256(Buffer.from('input-02')), index: 1 },
    { hash: crypto.sha256(Buffer.from('input-03')), index: 0 }
  ]
);

// Minimum fee transaction (exactly 50000 sats)
export const minFeeTransaction = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 50000
  },
  {
    script: createOpReturnOutput(SAMPLE_NFT_ID, SAMPLE_EXPIRY_BLOCK),
    value: 0
  }
]);

// Large OP_RETURN transaction (with parent inscription ID)
const largeNftId = `${SAMPLE_PARENT_ID}:${SAMPLE_NFT_ID}`;
export const largeOpReturnTransaction = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 70000
  },
  {
    script: createOpReturnOutput(largeNftId, SAMPLE_EXPIRY_BLOCK),
    value: 0
  }
]);

// Expired registration transaction
export const expiredRegistration = buildTxHex([
  {
    script: address.toOutputScript(SIGNET_CREATOR_ADDRESS, networks.testnet),
    value: 60000
  },
  {
    script: createOpReturnOutput(SAMPLE_NFT_ID, 190000), // Old block height
    value: 0
  }
]);