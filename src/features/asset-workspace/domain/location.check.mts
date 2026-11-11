/** Run: node src/features/asset-workspace/domain/location.check.mts */
import assert from "node:assert/strict";
import { filterLocations, locationTone, mapPin, rolledUpAssetCounts, selfAndDescendants, toTreeRows, validateLocationForm, type Location } from "./location.ts";

const loc = (id: string, parentId: string | null, extra: Partial<Location> = {}): Location => ({
  id, name: id.toUpperCase(), locationType: "Site", status: "Active", parentId, address: null, latitude: null,
  longitude: null, notes: null, assetCount: 0, childCount: 0, createdAt: "", updatedAt: "", ...extra,
});

// hq > (b > f), wh ; br ; orphan's parent is not in the list → root.
const all = [loc("wh", "hq"), loc("f", "b"), loc("br", null), loc("b", "hq"), loc("hq", null), loc("orphan", "gone")];

// Depth-first, siblings by name.
assert.deepEqual(
  toTreeRows(all).map((r) => `${r.id}:${r.depth}`),
  ["br:0", "hq:0", "b:1", "f:2", "wh:1", "orphan:0"],
);

// Roll-up: hq = own 1 + b 2 + f 4 + wh 8; b = 2 + 4; leaves keep their own.
const counted = [loc("hq", null, { assetCount: 1 }), loc("b", "hq", { assetCount: 2 }), loc("f", "b", { assetCount: 4 }), loc("wh", "hq", { assetCount: 8 })];
assert.deepEqual(Object.fromEntries(rolledUpAssetCounts(counted)), { hq: 15, b: 6, f: 4, wh: 8 });

// A loop never hangs and every row still shows once.
const loop = toTreeRows([loc("x", "y"), loc("y", "x")]);
assert.equal(loop.length, 2);

// Parent choices exclude the location and everything under it.
assert.deepEqual([...selfAndDescendants(all, "hq")].sort(), ["b", "f", "hq", "wh"]);
assert.deepEqual([...selfAndDescendants(all, "f")], ["f"]);

// A match keeps its ancestors; no filter = everything.
assert.deepEqual(filterLocations(all, { q: "f" }).map((l) => l.id).sort(), ["b", "f", "hq"]);
assert.equal(filterLocations(all, {}).length, all.length);
assert.deepEqual(filterLocations([...all, loc("off", null, { status: "Inactive" })], { status: "Inactive" }).map((l) => l.id), ["off"]);
assert.deepEqual(filterLocations([loc("r", "hq", { locationType: "Room" }), loc("hq", null)], { type: "Room" }).map((l) => l.id), ["r", "hq"]);

assert.equal(locationTone("Active"), "green");
assert.equal(locationTone("whatever"), "zinc");

const form = { name: " Hall ", locationType: "Room", parentId: "", address: "", latitude: "", longitude: "", notes: "" };
assert.deepEqual(validateLocationForm(form).input, { name: "Hall", locationType: "Room", parentId: null, address: null, latitude: null, longitude: null, notes: null });
assert.deepEqual(Object.keys(validateLocationForm({ ...form, name: " ", locationType: "" }).errors), ["name", "locationType"]);
assert.ok(validateLocationForm({ ...form, latitude: "13.7" }).errors.latitude, "one coordinate only");
assert.ok(validateLocationForm({ ...form, latitude: "91", longitude: "100" }).errors.latitude);
assert.ok(validateLocationForm({ ...form, latitude: "13", longitude: "abc" }).errors.longitude);
assert.ok(validateLocationForm({ ...form, notes: "x".repeat(501) }).errors.notes);
assert.deepEqual(validateLocationForm({ ...form, parentId: "p", latitude: "13.75", longitude: "100.5" }).input?.latitude, 13.75);

// Map pin: own coordinates, else nearest ancestor with some (named), else none; a loop stops.
const geo = [loc("hq", null, { latitude: 13.7, longitude: 100.5 }), loc("b", "hq"), loc("f", "b"), loc("r", "f", { latitude: 1, longitude: 2 })];
assert.deepEqual(mapPin(geo[3], geo), { latitude: 1, longitude: 2, from: null });
assert.deepEqual(mapPin(geo[2], geo), { latitude: 13.7, longitude: 100.5, from: "HQ" });
assert.equal(mapPin(loc("x", null), geo), null);
assert.equal(mapPin(loc("z", "x"), [loc("x", "y"), loc("y", "x")]), null);

console.log("location.check: ok");
