/** Run: node src/features/asset-workspace/services/asset-core-mapping.check.mts */
import assert from "node:assert/strict";
import type { AssetListRow } from "../../asset-intelligence/assets/services/asset-list-api.ts";
import { assetFromCore, statusFromCore, statusToCore, summaryFromCore } from "./asset-core-mapping.ts";

// Status mapping, both directions; Disposed has no Core value.
assert.equal(statusFromCore("Ready"), "Available");
assert.equal(statusFromCore("In Use"), "Assigned");
assert.equal(statusFromCore("In Progress"), "In Maintenance");
assert.equal(statusFromCore("Retired-Cancelled"), "Retired");
assert.equal(statusToCore("Available"), "Ready");
assert.equal(statusToCore("Assigned"), "In Use");
assert.equal(statusToCore("In Maintenance"), "In Progress");
assert.equal(statusToCore("Retired"), "Retired-Cancelled");
assert.equal(statusToCore("Disposed"), null);

const row: AssetListRow = {
  id: "a1",
  name: "Laptop",
  serial: "SN-1",
  category: "IT",
  subcategory: null,
  status: "In Use",
  owner: "Somchai",
  department: "Sales",
  building: null,
  floor: null,
  room: null,
  receivedDate: "2026-01-02",
  valueTHB: 30000,
};
const asset = assetFromCore(row);
assert.equal(asset.status, "Assigned");
assert.equal(asset.condition, null);
assert.deepEqual(asset.custody, { type: "person", id: "", label: "Somchai" });
assert.equal(assetFromCore({ ...row, status: "Ready", owner: null }).custody, null);

const summary = summaryFromCore({
  total: 10,
  byStatus: [
    { status: "Ready", count: 4, percent: 40 },
    { status: "In Use", count: 3, percent: 30 },
    { status: "Retired-Cancelled", count: 3, percent: 30 },
  ],
});
assert.equal(summary.total, 10);
assert.deepEqual(summary.byStatus, [
  { status: "Available", count: 4 },
  { status: "Assigned", count: 3 },
  { status: "In Maintenance", count: 0 },
  { status: "Retired", count: 3 },
  { status: "Disposed", count: 0 },
]);

console.log("asset-core-mapping: ok");
