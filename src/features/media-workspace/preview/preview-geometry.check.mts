import assert from "node:assert/strict";
import { defaultGeometry, editorGeometryOptions, groupDeviceGeometries, resolveFrameAspectRatio, resolveFramePixels } from "./preview-geometry.ts";

// Duplicate geometries collapse into one counted option; Unknown trails the parseable groups.
const grouped = groupDeviceGeometries(["1920x1080", "1080x1920", "1920x1080", null, "garbage", "1920x1080"]);
assert.deepEqual(grouped.map((option) => option.label), ["1080x1920 (1)", "1920x1080 (3)", "Unknown (2)"]);
assert.equal(grouped[2].resolution, null);

// The default is the biggest group, not the first one in display order.
assert.equal(defaultGeometry(grouped)?.id, "1920x1080");
assert.equal(defaultGeometry([]), null);

// An all-unknown fleet still yields a selectable group rather than an empty list.
assert.deepEqual(groupDeviceGeometries([null, null]).map((option) => option.id), ["unknown"]);
assert.deepEqual(groupDeviceGeometries([]), []);

// Editor: reference resolution only, and nothing at all for a legacy Layout.
assert.equal(editorGeometryOptions("1080x1920")[0].resolution, "1080x1920");
assert.deepEqual(editorGeometryOptions(null), []);

// Frame resolution order: target geometry → reference resolution → stored ratio → 16:9.
assert.equal(resolveFrameAspectRatio(grouped[0], "1920x1080", "16:9"), "9:16");
assert.equal(resolveFrameAspectRatio(grouped[2], "1080x1920", "16:9"), "9:16");
assert.equal(resolveFrameAspectRatio(grouped[2], null, "21:9"), "21:9");
assert.equal(resolveFrameAspectRatio(null, null, null), "16:9");
assert.equal(resolveFrameAspectRatio(null, null, "not-a-ratio"), "16:9");

// Actual-size pixels follow the same order, and are absent when nothing reports a resolution.
assert.deepEqual(resolveFramePixels(grouped[0], "1920x1080"), [1080, 1920]);
assert.deepEqual(resolveFramePixels(grouped[2], "1920x1080"), [1920, 1080]);
assert.equal(resolveFramePixels(grouped[2], null), null);
assert.equal(resolveFramePixels(null, null), null);

console.log("preview-geometry.check.mts OK");
