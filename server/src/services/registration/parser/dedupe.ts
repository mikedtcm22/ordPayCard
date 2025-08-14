/**
 * Order-preserving deduplication of txid strings.
 * Always returns a new array instance.
 */
export function dedupeTxids(txids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of txids) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}


