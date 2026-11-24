import assert from "node:assert/strict";
import { validateZones } from "./geometry.ts";
import { splitZone } from "./split-zone.ts";

const zones = [{ position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 }];
const split = splitZone(zones, 0);
assert.ok(split);
assert.equal(split.length, 2);
assert.equal(split[0].width + split[1].width, 100);
assert.equal(split[1].x, split[0].width);
assert.deepEqual(validateZones(split), []);

let sixZones = zones;
for (let n = 0; n < 5; n += 1) sixZones = splitZone(sixZones, n) ?? sixZones;
assert.equal(sixZones.length, 6);
assert.deepEqual(validateZones(sixZones), []);
console.log("split-zone.check.mts OK");
