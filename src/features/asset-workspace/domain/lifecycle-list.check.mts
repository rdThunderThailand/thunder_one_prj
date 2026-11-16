// node src/features/asset-workspace/domain/lifecycle-list.check.mts
import assert from "node:assert/strict";
import { lifecycleRowMenu, lifecycleTileUpdate, readLwTab } from "./lifecycle-list.ts";
import { warrantyRowMenu, warrantyTileUpdate } from "./warranty-list.ts";

// FE 01 tab parsing
assert.equal(readLwTab(undefined), "lifecycle");
assert.equal(readLwTab("warranty"), "warranty");
assert.equal(readLwTab("WARRANTY"), "lifecycle");
assert.equal(readLwTab(["warranty"]), "lifecycle");

// FE 02 tiles: set, then the same tile clears; another tile replaces
const issues = lifecycleTileUpdate("Condition Issues", {});
assert.deepEqual(issues, { status: "Available,Assigned,In Maintenance,Retired", condition: "Damaged,Unusable" });
assert.deepEqual(lifecycleTileUpdate("Condition Issues", issues), { status: undefined, condition: undefined });
assert.deepEqual(lifecycleTileUpdate("Retired", issues), { status: "Retired", condition: undefined });
assert.deepEqual(lifecycleTileUpdate("Retired", { status: "Retired" }), { status: undefined, condition: undefined });
// Retired with a condition filter set by hand is not "the Retired tile", so the click sets the tile's filter
assert.deepEqual(lifecycleTileUpdate("Retired", { status: "Retired", condition: "Fair" }), { status: "Retired", condition: undefined });

// FE 02 menu by status (PO 05 §4.11)
const enabled = (status: string, custody: { id: string } | null = null) =>
  lifecycleRowMenu({ id: "a1", status, custody }).filter((item) => !item.reason).map((item) => item.key);
assert.deepEqual(enabled("Disposed"), ["view"]);
assert.deepEqual(enabled("Available"), ["view", "change-status", "change-condition", "move-location", "retire"]);
assert.deepEqual(enabled("Assigned", { id: "p" }), ["view", "change-status", "change-condition", "move-location"]);
assert.deepEqual(enabled("In Maintenance"), ["view", "change-status", "change-condition", "move-location", "retire"]);
assert.deepEqual(enabled("In Maintenance", { id: "p" }), ["view", "change-status", "change-condition", "move-location"]);
assert.deepEqual(enabled("Retired"), ["view", "change-status", "change-condition", "dispose"]);
const available = lifecycleRowMenu({ id: "a 1", status: "Available", custody: null });
assert.equal(available.find((item) => item.key === "dispose")?.reason, "Only available when Retired");
assert.equal(available.find((item) => item.key === "move-location")?.href, "/asset-workspace/assets/a%201?tab=location&action=move-location");

// FE 03 tiles and menu
assert.deepEqual(warrantyTileUpdate("Expired"), { status: "Expired" });
assert.deepEqual(warrantyTileUpdate("Expired", "Expired"), { status: undefined });
const none = warrantyRowMenu({ assetId: "a1", warrantyId: null });
assert.equal(none.find((item) => item.key === "edit")?.reason, "No current warranty");
const current = warrantyRowMenu({ assetId: "a1", warrantyId: "w1" });
assert.equal(current.find((item) => item.key === "edit")?.href, "/asset-workspace/assets/a1/warranty/w1/edit");
assert.equal(current.find((item) => item.key === "history")?.href, "/asset-workspace/assets/a1?tab=warranty");
assert.ok(current.every((item) => !item.reason));

console.log("lifecycle-list checks passed");
