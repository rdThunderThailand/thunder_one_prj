import { isFreshSeed, markSeedShown, type SectionSeed } from "./assets-list-seed.ts";

/** The first read of a page uses the data the server started. A retry, a Reload or a failed server read asks from the browser. */
export async function seededRead<T, R>(seed: SectionSeed<T> | undefined, key: string, browserRead: () => Promise<R>): Promise<R | { ok: true; data: T }> {
  if (!isFreshSeed(seed, key)) return browserRead();
  // After this turn, so React's second development mount still uses it.
  queueMicrotask(() => markSeedShown(seed));
  // `Promise.resolve`: the streamed value has its own `then`, so `.catch` on it returns nothing.
  const data = await Promise.resolve(seed.data).catch(() => null);
  return data ? { ok: true, data } : browserRead();
}
