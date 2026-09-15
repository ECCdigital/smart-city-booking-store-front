/**
 * A small bounded memo keyed by a Theme Bundle etag.
 *
 * The theme assets — the rendered stylesheet, the favicon bytes — are derived
 * from the bundle and change only when it does, so the etag is their cache
 * key. A new entry appears only when an admin saves; the cap is a guard
 * against an unbounded map rather than a working eviction policy, which is why
 * it simply drops the oldest key.
 */
export function createEtagMemo<T>(maxEntries: number) {
  const entries = new Map<string, T>();

  return {
    get(etag: string): T | undefined {
      return entries.get(etag);
    },
    set(etag: string, value: T): T {
      if (entries.size >= maxEntries) {
        entries.delete(entries.keys().next().value!);
      }
      entries.set(etag, value);
      return value;
    },
  };
}
