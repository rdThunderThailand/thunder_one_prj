import assert from "node:assert/strict";
import { assetListQueryString, readAssetListSearch, withListDefaults } from "./assets-list-query.ts";
import { firstAssetListQuery, isFreshSeed, markSeedShown } from "./assets-list-seed.ts";

const defaults = { pageSize: 50, sort: "status_since" } as const;
const category = "11111111-1111-4111-8111-111111111111";

/** What the browser asks for, as in AssetsListView. */
function browserKey(search: string) {
  const parsed = readAssetListSearch(search);
  return parsed.success ? assetListQueryString(withListDefaults(parsed.data, search, defaults)) : null;
}
/** Next's `searchParams` for the same URL. */
function pageParams(search: string) {
  const params = new URLSearchParams(search);
  return Object.fromEntries([...new Set(params.keys())].map((key) => {
    const values = params.getAll(key);
    return [key, values.length > 1 ? values : values[0]];
  }));
}

for (const search of [
  "", "page=2", "pageSize=10", "page_size=100", "sort=created_at", "q=two+words", "q=", "q=%20", "q=a%26b%3Dc", "scan=1",
  `category_id=${category}&include_child_categories=true`, "status=Available&condition=Good",
  // Invalid for the browser, so the server must not load a list either.
  "page=0", "status=Nope", "custody_id=x", "page=1&page=2", "category_id=not-a-guid",
]) {
  const query = firstAssetListQuery(pageParams(search), defaults);
  assert.equal(query && assetListQueryString(query), browserKey(search), `server and browser differ for "${search}"`);
}
assert.equal(firstAssetListQuery({}, undefined)?.pageSize, 25);
assert.equal(firstAssetListQuery({ q: undefined })?.q, undefined);

// Only the exact request, only once, and only while it is new.
const seed = { key: "page=1", at: Date.now(), data: Promise.resolve(1) };
assert.equal(isFreshSeed(seed, "page=1", seed.at + 59_000), true);
assert.equal(isFreshSeed(seed, "page=1", seed.at + 60_000), false);
assert.equal(isFreshSeed(seed, "page=2"), false);
assert.equal(isFreshSeed(seed, "page=1"), true);
assert.equal(isFreshSeed(null, "page=1"), false);
markSeedShown(seed);
assert.equal(isFreshSeed(seed, "page=1"), false);
assert.equal(isFreshSeed({ ...seed }, "page=1"), true);

console.log("Asset list first data checks passed.");
