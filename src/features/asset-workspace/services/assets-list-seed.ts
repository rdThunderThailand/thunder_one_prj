import { readAssetListSearch, withListDefaults, type AssetListDefaults, type AssetListQuery, type AssetSearchParams } from "./assets-list-query.ts";
import type { AssetFilterOptions, AssetListData, AssetSummaryData } from "./assets-list-types.ts";

/**
 * First data of one section, read on the server and streamed after the page. `key` names the exact request it answers.
 * `at`: when the server started the read. `null` data: the server read failed, so the browser loads that section.
 */
export interface SectionSeed<T> { key: string; at: number; data: Promise<T | null> }

export interface AssetsListSeeds {
  /** `null`: the URL is invalid, so there is no list to read. */
  list: SectionSeed<AssetListData> | null;
  summary: SectionSeed<AssetSummaryData>;
  filters: SectionSeed<AssetFilterOptions>;
}

export const SUMMARY_KEY = "summary";
export const FILTERS_KEY = "filters";

/** The same query the browser builds from the URL, or `null` when the URL is invalid. */
export function firstAssetListQuery(params: AssetSearchParams, defaults?: AssetListDefaults): AssetListQuery | null {
  const search = new URLSearchParams(Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? ""]).map((item) => [key, item]))).toString();
  const parsed = readAssetListSearch(search);
  return parsed.success ? withListDefaults(parsed.data, search, defaults) : null;
}

// Back can bring the same server data again after the page was left; it may be old by then.
const shown = new WeakSet<object>();
// For a page that was left before it showed. A device clock that runs ahead only means the browser loads the data.
const MAX_AGE_MS = 60_000;

export function markSeedShown(seed: object) {
  shown.add(seed);
}

export function isFreshSeed<T>(seed: SectionSeed<T> | null | undefined, key: string, now = Date.now()): seed is SectionSeed<T> {
  return Boolean(seed) && seed!.key === key && !shown.has(seed!) && now - seed!.at < MAX_AGE_MS;
}
