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
console.log("split-zone.check.mts OK");
