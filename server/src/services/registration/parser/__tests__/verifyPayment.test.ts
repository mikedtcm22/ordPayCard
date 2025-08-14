import { networks, payments, address, Transaction } from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { verifyPayment } from '../verifyPayment';

const ECPair = ECPairFactory(ecc);

function makeKeyPair() {
  return ECPair.makeRandom({ network: networks.testnet });
}

function toBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}

function asciiToHex(input: string): string {
  return Array.from(input)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
}

function encodeOpReturnScript(payload: string): Buffer {
  const dataHex = asciiToHex(payload);
  const length = dataHex.length / 2;
  if (length <= 75) {
    const lenHex = length.toString(16).padStart(2, '0');
    return Buffer.from(`6a${lenHex}${dataHex}`, 'hex');
  } else {
    const lenHex = length.toString(16).padStart(2, '0');
    return Buffer.from(`6a4c${lenHex}${dataHex}`, 'hex');
  }
}

function buildTxHex(params: {
  opReturnPayload?: string;
  outputs: Array<{ addr: string; value: number }>;
}): string {
  const tx = new Transaction();
  tx.version = 2;
  const prevTxId = Buffer.alloc(32, 2);
  tx.addInput(prevTxId, 0xffffffff);
  if (params.opReturnPayload) {
    tx.addOutput(encodeOpReturnScript(params.opReturnPayload), 0);
  }
  for (const o of params.outputs) {
    const script = address.toOutputScript(o.addr, networks.testnet);
    tx.addOutput(script, o.value);
  }
  return tx.toHex();
}

describe('verifyPayment (A3)', () => {
  const creatorKey = makeKeyPair();
  const creatorAddr = payments.p2wpkh({ pubkey: toBuffer(creatorKey.publicKey), network: networks.testnet }).address!;
  const otherAddr = payments.p2wpkh({ pubkey: toBuffer(makeKeyPair().publicKey), network: networks.testnet }).address!;

  const nftId = 'nft-abc-123';
  const currentBlock = 200000;

  test('returns 0n when OP_RETURN is missing', async () => {
    const hex = buildTxHex({ outputs: [{ addr: creatorAddr, value: 1000 }] });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, { currentBlock, network: 'testnet' });
    expect(amt).toBe(0n);
  });

  test('returns 0n when OP_RETURN nftId mismatches', async () => {
    const payload = `different-id|${currentBlock + 10}`;
    const hex = buildTxHex({ opReturnPayload: payload, outputs: [{ addr: creatorAddr, value: 2000 }] });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, { currentBlock, network: 'testnet' });
    expect(amt).toBe(0n);
  });

  test('returns 0n when OP_RETURN is expired', async () => {
    const payload = `${nftId}|${currentBlock - 1}`;
    const hex = buildTxHex({ opReturnPayload: payload, outputs: [{ addr: creatorAddr, value: 2000 }] });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, { currentBlock, network: 'testnet' });
    expect(amt).toBe(0n);
  });

  test('returns 0n when tx block is below minBlock gate', async () => {
    const payload = `${nftId}|${currentBlock + 10}`;
    const hex = buildTxHex({ opReturnPayload: payload, outputs: [{ addr: creatorAddr, value: 3000 }] });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, {
      currentBlock,
      network: 'testnet',
      minBlock: 210000,
      txBlockHeight: 209999,
    } as any);
    expect(amt).toBe(0n);
  });

  test('returns 0n when sum to creator is below minFee', async () => {
    const payload = `${nftId}|${currentBlock + 10}`;
    const hex = buildTxHex({
      opReturnPayload: payload,
      outputs: [
        { addr: creatorAddr, value: 500 },
        { addr: otherAddr, value: 10_000 },
      ],
    });
    const amt = await verifyPayment(hex, creatorAddr, 1_000n, nftId, {
      currentBlock,
      network: 'testnet',
      txBlockHeight: 220000,
    } as any);
    expect(amt).toBe(0n);
  });

  test('returns total sum to creator across multiple outputs when valid', async () => {
    const payload = `${nftId}|${currentBlock + 10}`;
    const hex = buildTxHex({
      opReturnPayload: payload,
      outputs: [
        { addr: otherAddr, value: 111 },
        { addr: creatorAddr, value: 2_000 },
        { addr: creatorAddr, value: 3_000 },
      ],
    });
    const amt = await verifyPayment(hex, creatorAddr, 1_000n, nftId, {
      currentBlock,
      network: 'testnet',
      txBlockHeight: 220000,
    } as any);
    expect(amt).toBe(5_000n);
  });

  test('resolves raw tx hex via txid using fetchTx and returns sum when valid', async () => {
    const payload = `${nftId}|${currentBlock + 5}`;
    const hex = buildTxHex({
      opReturnPayload: payload,
      outputs: [
        { addr: creatorAddr, value: 7_000 },
      ],
    });
    const txid = 'a'.repeat(64);
    const fetchTx = jest.fn().mockResolvedValue(hex);

    const amt = await verifyPayment(txid, creatorAddr, 1_000n, nftId, {
      currentBlock,
      network: 'testnet',
      txBlockHeight: 220001,
      fetchTx,
    } as any);
    expect(fetchTx).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledWith(txid);
    expect(amt).toBe(7_000n);
  });

  test('returns 0n when txid provided but no fetchTx resolver is available', async () => {
    const txid = 'b'.repeat(64);
    const amt = await verifyPayment(txid, creatorAddr, 1n, nftId, {
      currentBlock,
      network: 'testnet',
    } as any);
    expect(amt).toBe(0n);
  });

  test('returns 0n when minBlock is specified but txBlockHeight is missing', async () => {
    const payload = `${nftId}|${currentBlock + 10}`;
    const hex = buildTxHex({ opReturnPayload: payload, outputs: [{ addr: creatorAddr, value: 2_000 }] });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, {
      currentBlock,
      network: 'testnet',
      minBlock: 210000,
      // txBlockHeight intentionally omitted
    } as any);
    expect(amt).toBe(0n);
  });

  test('supports regtest network mapping end-to-end', async () => {
    const payload = `${nftId}|${currentBlock + 10}`;
    const hex = buildTxHex({
      opReturnPayload: payload,
      outputs: [
        { addr: creatorAddr, value: 1_234 },
      ],
    });
    const amt = await verifyPayment(hex, creatorAddr, 1n, nftId, {
      currentBlock,
      network: 'regtest',
      txBlockHeight: 220000,
    } as any);
    expect(amt).toBe(1_234n);
  });
});


