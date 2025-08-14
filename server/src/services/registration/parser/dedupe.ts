/**
 * Order-preserving deduplication of txid strings using a Map.
 * Map enables easy extension to counts/metadata later without changing structure.
 * Always returns a new array instance.
 */
export function dedupeTxids(txids: string[]): string[] {
  const map = new Map<string, true>();
  for (const id of txids) {
    if (!map.has(id)) map.set(id, true);
  }
  return Array.from(map.keys());
}


