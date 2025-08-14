import { getLastTransferHeight } from '../lastTransfer';

function makeHex(length: number): string {
  return 'a'.repeat(length);
}

describe('getLastTransferHeight (A0)', () => {
  const txid = makeHex(64);

  test('returns null when metadata is missing and does not call fetchTx', async () => {
    const fetchMeta = jest.fn().mockResolvedValue(null);
    const fetchTx = jest.fn();

    const result = await getLastTransferHeight('INSCR_A', { fetchMeta, fetchTx });
    expect(result).toBeNull();
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).not.toHaveBeenCalled();
  });

  test('returns height when satpoint is present and tx is confirmed', async () => {
    const fetchMeta = jest.fn().mockResolvedValue({ satpoint: `${txid}:0:0` });
    const fetchTx = jest.fn().mockResolvedValue({ status: { confirmed: true }, block_height: 123456 });

    const result = await getLastTransferHeight('INSCR_B', { fetchMeta, fetchTx });
    expect(result).toBe(123456);
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledWith(txid);
  });

  test('returns null when tx is unconfirmed', async () => {
    const fetchMeta = jest.fn().mockResolvedValue({ satpoint: `${txid}:1:0` });
    const fetchTx = jest.fn().mockResolvedValue({ status: { confirmed: false } });

    const result = await getLastTransferHeight('INSCR_C', { fetchMeta, fetchTx });
    expect(result).toBeNull();
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledTimes(1);
  });

  test('cache hit within 30s avoids re-fetch and returns same value', async () => {
    const startMs = 1_000_000;
    const now = { t: startMs };
    const nowMs = () => now.t;
    const fetchMeta = jest.fn().mockResolvedValue({ satpoint: `${txid}:0:0` });
    const fetchTx = jest.fn().mockResolvedValue({ block_height: 222222 });

    const deps = { fetchMeta, fetchTx, nowMs };

    const first = await getLastTransferHeight('INSCR_D', deps);
    expect(first).toBe(222222);
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledTimes(1);

    now.t = startMs + 15_000; // within TTL
    const second = await getLastTransferHeight('INSCR_D', deps);
    expect(second).toBe(222222);
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledTimes(1);
  });

  test('cache expiry after 30s triggers re-fetch and reflects updated value', async () => {
    const startMs = 2_000_000;
    const now = { t: startMs };
    const nowMs = () => now.t;
    const fetchMeta = jest.fn().mockResolvedValue({ satpoint: `${txid}:0:0` });
    const fetchTx = jest
      .fn()
      .mockResolvedValueOnce({ block_height: 300000 })
      .mockResolvedValueOnce({ block_height: 300123 });

    const deps = { fetchMeta, fetchTx, nowMs };

    const first = await getLastTransferHeight('INSCR_E', deps);
    expect(first).toBe(300000);
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).toHaveBeenCalledTimes(1);

    now.t = startMs + 30_000; // TTL boundary → re-fetch
    const second = await getLastTransferHeight('INSCR_E', deps);
    expect(second).toBe(300123);
    expect(fetchMeta).toHaveBeenCalledTimes(2);
    expect(fetchTx).toHaveBeenCalledTimes(2);
  });

  test('uses `location` when `satpoint` is missing', async () => {
    const altTxid = makeHex(64).replace(/a/g, 'b');
    const fetchMeta = jest.fn().mockResolvedValue({ location: `${altTxid}:2:0` });
    const fetchTx = jest.fn().mockResolvedValue({ block_height: 444444 });

    const result = await getLastTransferHeight('INSCR_F', { fetchMeta, fetchTx });
    expect(result).toBe(444444);
    expect(fetchTx).toHaveBeenCalledWith(altTxid);
  });

  test('malformed satpoint/location returns null and does not call fetchTx', async () => {
    const fetchMeta = jest.fn().mockResolvedValue({ satpoint: 'not-a-satpoint' });
    const fetchTx = jest.fn();

    const result = await getLastTransferHeight('INSCR_G', { fetchMeta, fetchTx });
    expect(result).toBeNull();
    expect(fetchMeta).toHaveBeenCalledTimes(1);
    expect(fetchTx).not.toHaveBeenCalled();
  });

  test('dependency error surfaces as null (fail-closed)', async () => {
    const fetchMeta = jest.fn().mockRejectedValue(new Error('meta error'));
    const fetchTx = jest.fn();

    const result = await getLastTransferHeight('INSCR_H', { fetchMeta, fetchTx });
    expect(result).toBeNull();
    expect(fetchTx).not.toHaveBeenCalled();
  });

  test('per-inscription cache isolation', async () => {
    const txidA = txid;
    const txidB = makeHex(64).replace(/a/g, 'c');
    const startMs = 3_000_000;
    const now = { t: startMs };
    const nowMs = () => now.t;

    const fetchMeta = jest.fn().mockImplementation(async (id: string) => {
      if (id === 'A') return { satpoint: `${txidA}:0:0` };
      if (id === 'B') return { satpoint: `${txidB}:0:0` };
      return null;
    });
    const fetchTx = jest.fn().mockImplementation(async (tx: string) => {
      if (tx === txidA) return { block_height: 555000 };
      if (tx === txidB) return { block_height: 666000 };
      return { status: { confirmed: false } };
    });

    const deps = { fetchMeta, fetchTx, nowMs };

    const resA1 = await getLastTransferHeight('A', deps);
    const resB1 = await getLastTransferHeight('B', deps);
    expect(resA1).toBe(555000);
    expect(resB1).toBe(666000);
    expect(fetchMeta).toHaveBeenCalledTimes(2);
    expect(fetchTx).toHaveBeenCalledTimes(2);

    now.t = startMs + 10_000;
    const resA2 = await getLastTransferHeight('A', deps);
    expect(resA2).toBe(555000);
    // Still only two unique fetches
    expect(fetchMeta).toHaveBeenCalledTimes(2);
    expect(fetchTx).toHaveBeenCalledTimes(2);
  });
});


