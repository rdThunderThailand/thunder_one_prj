import assert from "node:assert/strict";
import { choicesFrom, myAssetsQuery } from "./my-assets-query.ts";

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
