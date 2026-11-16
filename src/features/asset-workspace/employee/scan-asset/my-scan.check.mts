import assert from "node:assert/strict";
import { myAssetHref, myScanResult } from "./my-scan.ts";

const asset = { id: "11111111-1111-4111-8111-111111111111", name: "Laptop", asset_code: "AST-1", serial_number: null, category_name: null, location_name: null, status: "Assigned", condition: null };
const found = myScanResult(200, { success: true, data: { outcome: "found", identifier: { type: "asset_tag", value: "AST-1" }, asset } });
assert.equal(found.kind, "found");
assert.equal(found.kind === "found" && found.data.asset.id, asset.id);

// A 200 with a wrong shape is an error, never a found asset.
assert.equal(myScanResult(200, { data: { outcome: "found" } }).kind, "error");
assert.equal(myScanResult(200, null).kind, "error");

assert.equal(myScanResult(404, null).kind, "not_found");
assert.equal(myScanResult(409, null).kind, "ambiguous");
assert.equal(myScanResult(400, null).kind, "invalid");
assert.equal(myScanResult(500, null).kind, "error");

assert.equal(myAssetHref(asset.id), `/asset-workspace/my-assets/${asset.id}`);
console.log("my-scan: ok");
