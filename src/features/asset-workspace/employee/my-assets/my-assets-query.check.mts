import assert from "node:assert/strict";
import { choicesFrom, myAssetsQuery, warrantyLeft } from "./my-assets-query.ts";

const id = "11111111-1111-4111-8111-111111111111";

// Tabs map to status; All and no tab send none.
assert.equal(myAssetsQuery({ tab: "assigned" })?.status, "Assigned");
assert.equal(myAssetsQuery({ tab: "in-maintenance" })?.status, "In Maintenance");
assert.equal(myAssetsQuery({ tab: "all" })?.status, undefined);
assert.equal(myAssetsQuery({})?.status, undefined);

// Custody and a raw status in the URL are never read.
const q = myAssetsQuery({ custody_type: "person", custody_id: id, status: "Retired", q: " laptop ", category_id: id });
assert.equal(q?.custody_type, undefined);
assert.equal(q?.custody_id, undefined);
assert.equal(q?.status, undefined);
assert.equal(q?.q, "laptop");
assert.equal(q?.category_id, id);

// Invalid filter → null (error state), not a silent unfiltered list.
assert.equal(myAssetsQuery({ category_id: "nope" }), null);
assert.equal(myAssetsQuery({ condition: "Shiny" }), null);

// Choices: unique, named, sorted; null ids skipped.
const choices = choicesFrom([
  { asset_category_id: "b", category_name: "Laptop", location_id: "x", location_name: null },
  { asset_category_id: "a", category_name: "Desk", location_id: "x", location_name: null },
  { asset_category_id: "b", category_name: "Laptop", location_id: null, location_name: null },
]);
assert.deepEqual(choices.categories, [{ value: "a", label: "Desk" }, { value: "b", label: "Laptop" }]);
assert.deepEqual(choices.locations, [{ value: "x", label: "Unnamed" }]);

console.log("my-assets-query: ok");

// Warranty time left (asset view).
{
  assert.equal(warrantyLeft(null, null, "2026-11-16"), null);
  assert.deepEqual(warrantyLeft("2026-01-01", "2026-11-26", "2026-11-16")?.text, "10 days left");
  assert.equal(warrantyLeft(null, "2026-11-17", "2026-11-16")?.text, "1 day left");
  assert.equal(warrantyLeft(null, "2026-11-16", "2026-11-16")?.text, "Ends today");
  assert.equal(warrantyLeft(null, "2026-11-10", "2026-11-16")?.text, "Ended 6 days ago");
  assert.equal(warrantyLeft("2026-11-01", "2026-11-21", "2026-11-11")?.usedPct, 50);
  assert.equal(warrantyLeft("2026-11-01", "2026-11-21", "2026-12-30")?.usedPct, 100);
  assert.equal(warrantyLeft(null, "2026-11-21", "2026-11-11")?.usedPct, null);
}
