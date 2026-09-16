/** Run: node src/features/playlists/content-compatibility.check.mts */
import assert from "node:assert/strict";
import { checkContentCompatibility } from "./content-compatibility.ts";

const HD = "1920x1080";

// Exact match, and anything larger, are fine — downscaling is not a defect.
assert.equal(checkContentCompatibility(HD, { width: 1920, height: 1080 }), null);
assert.equal(checkContentCompatibility(HD, { width: 3840, height: 2160 }), null);

// Same ratio, below the 90% floor.
assert.equal(checkContentCompatibility(HD, { width: 1280, height: 720 }), "resolution");
// Same ratio, just above the floor — invisible upscale, stays silent.
assert.equal(checkContentCompatibility(HD, { width: 1728, height: 972 }), null);

// One rule covers both pillarboxing and portrait-on-landscape.
assert.equal(checkContentCompatibility(HD, { width: 1440, height: 1080 }), "aspect");
assert.equal(checkContentCompatibility(HD, { width: 1080, height: 1920 }), "aspect");
assert.equal(checkContentCompatibility("1080x1920", { width: 1920, height: 1080 }), "aspect");
// A few pixels off the ratio is the same ratio.
assert.equal(checkContentCompatibility(HD, { width: 1918, height: 1080 }), null);
// Aspect wins when both are wrong — it is the one the operator has to fix.
assert.equal(checkContentCompatibility(HD, { width: 640, height: 480 }), "aspect");

// Unknown dimensions on either side are silent, never a warning.
assert.equal(checkContentCompatibility(HD, {}), null);
assert.equal(checkContentCompatibility(HD, { width: 1920 }), null);
assert.equal(checkContentCompatibility(undefined, { width: 640, height: 480 }), null);
assert.equal(checkContentCompatibility("", { width: 640, height: 480 }), null);
assert.equal(checkContentCompatibility("1080p", { width: 640, height: 480 }), null);

console.log("content-compatibility.check.mts — all assertions passed");
