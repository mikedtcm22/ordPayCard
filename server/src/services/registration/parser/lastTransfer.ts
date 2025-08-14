/**
 * Last-transfer height derivation utility
 *
 * Derives the block height of the parent inscription's most recent transfer by:
 * - Fetching inscription metadata and reading its current satpoint (or location)
 * - Extracting the txid from the satpoint string: "<txid>:<vout>:<offset>"
 * - Fetching the transaction and returning its block height if confirmed
 * - Caching the result for 30 seconds per inscriptionId to reduce network calls
 *
 * Fail-closed: returns null on missing metadata, malformed satpoint/location,
 * unconfirmed tx, missing height, or dependency errors.
 */

export type FetchMeta = (inscriptionId: string) => Promise<any>;
export type FetchTx = (txid: string) => Promise<any>;

export interface LastTransferDeps {
  fetchMeta: FetchMeta;
  fetchTx: FetchTx;
  nowMs?: () => number;
}

const THIRTY_SECONDS_MS = 30_000;

type CacheEntry = { height: number | null; expiresAtMs: number };
const cacheByInscriptionId: Map<string, CacheEntry> = new Map();

/**
 * Extract a 64-hex-character txid from a satpoint/location string.
 * Expected format: "<txid>:<vout>:<offset>".
 */
function extractTxidFromSatpointString(satpointOrLocation: unknown): string | null {
  if (typeof satpointOrLocation !== 'string') return null;
  const parts = satpointOrLocation.split(':');
  if (parts.length !== 3) return null;
  const candidateTxid = parts[0] ?? null;
  if (!candidateTxid || candidateTxid.length !== 64) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(candidateTxid)) return null;
  return candidateTxid.toLowerCase();
}

/**
 * Determine a transaction's block height if confirmed; otherwise null.
 * Accepts objects that may look like esplora responses.
 */
function deriveConfirmedBlockHeight(txLike: any): number | null {
  if (!txLike || typeof txLike !== 'object') return null;
  // If an explicit confirmation flag is provided and false, treat as unconfirmed.
  const status = txLike.status;
  if (status && typeof status === 'object' && status.confirmed === false) return null;

  const height = txLike.block_height;
  if (typeof height === 'number' && height > 0) return height;
  return null;
}

/**
 * Return current time in ms from deps or Date.now().
 */
function getNowMs(deps?: LastTransferDeps): number {
  return (deps && deps.nowMs ? deps.nowMs() : Date.now());
}

/**
 * Get the block height of the parent inscription's last transfer.
 *
 * @param inscriptionId - The parent inscription id
 * @param deps - Dependency bag for metadata/tx fetch and an optional clock
 * @returns Block height number or null if unknown/unconfirmed/error
 */
export async function getLastTransferHeight(
  inscriptionId: string,
  deps: LastTransferDeps,
): Promise<number | null> {
  const now = getNowMs(deps);
  const cached = cacheByInscriptionId.get(inscriptionId);
  if (cached && now < cached.expiresAtMs) {
    return cached.height;
  }

  try {
    const meta = await deps.fetchMeta(inscriptionId);
    if (!meta || typeof meta !== 'object') {
      const entry: CacheEntry = { height: null, expiresAtMs: now + THIRTY_SECONDS_MS };
      cacheByInscriptionId.set(inscriptionId, entry);
      return null;
    }

    const satpointOrLocation: unknown = (meta as any).satpoint ?? (meta as any).location;
    const txid = extractTxidFromSatpointString(satpointOrLocation);
    if (!txid) {
      const entry: CacheEntry = { height: null, expiresAtMs: now + THIRTY_SECONDS_MS };
      cacheByInscriptionId.set(inscriptionId, entry);
      return null;
    }

    const tx = await deps.fetchTx(txid);
    const height = deriveConfirmedBlockHeight(tx);

    const entry: CacheEntry = { height, expiresAtMs: now + THIRTY_SECONDS_MS };
    cacheByInscriptionId.set(inscriptionId, entry);
    return height;
  } catch {
    const entry: CacheEntry = { height: null, expiresAtMs: now + THIRTY_SECONDS_MS };
    cacheByInscriptionId.set(inscriptionId, entry);
    return null;
  }
}


