export interface LatestChildDeps {
  fetchChildren: (inscriptionId: string) => Promise<unknown[]>;
  nowMs?: () => number;
}

const THIRTY_SECONDS_MS = 30_000;

type CacheEntry = { height: number | null; expiresAtMs: number };
const cacheByInscriptionId: Map<string, CacheEntry> = new Map();

function getNowMs(deps?: LatestChildDeps): number {
  return deps?.nowMs ? deps.nowMs() : Date.now();
}

/**
 * Returns the maximum genesis height among provenance children of a parent inscription.
 * Looks for `height` or `genesis_height` fields; fail-closed to null on errors.
 * Caches results per parent id for 30 seconds.
 */
export async function getLatestChildHeight(
  parentInscriptionId: string,
  deps: LatestChildDeps,
): Promise<number | null> {
  const now = getNowMs(deps);
  const cached = cacheByInscriptionId.get(parentInscriptionId);
  if (cached && now < cached.expiresAtMs) return cached.height;

  try {
    const children = await deps.fetchChildren(parentInscriptionId);
    if (!Array.isArray(children) || children.length === 0) {
      const entry = { height: null, expiresAtMs: now + THIRTY_SECONDS_MS };
      cacheByInscriptionId.set(parentInscriptionId, entry);
      return null;
    }
    let maxHeight: number | null = null;
    for (const c of children) {
      const child = c as Record<string, unknown>;
      const h = typeof child?.['height'] === 'number' ? child['height'] : typeof child?.['genesis_height'] === 'number' ? child['genesis_height'] : null;
      if (typeof h === 'number' && (maxHeight === null || h > maxHeight)) maxHeight = h;
    }
    const entry = { height: maxHeight, expiresAtMs: now + THIRTY_SECONDS_MS };
    cacheByInscriptionId.set(parentInscriptionId, entry);
    return maxHeight;
  } catch {
    const entry = { height: null, expiresAtMs: now + THIRTY_SECONDS_MS };
    cacheByInscriptionId.set(parentInscriptionId, entry);
    return null;
  }
}


