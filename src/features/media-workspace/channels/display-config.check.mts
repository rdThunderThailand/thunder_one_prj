/** Run: node src/features/media-workspace/channels/display-config.check.mts */
import assert from "node:assert/strict";
import { ARRANGEMENT_OPTIONS, arrangementByKey, autoMapScreens, buildDisplayConfig, canvasResolution } from "./display-config.ts";

// Matches the mockup exactly: 1×3 horizontal @ 1920x1080 → 5760x1080.
assert.equal(canvasResolution({ rows: 1, cols: 3 }, "1920x1080"), "5760x1080");
assert.equal(canvasResolution({ rows: 2, cols: 2 }, "1920x1080"), "3840x2160");
assert.equal(canvasResolution({ rows: 1, cols: 2 }, "1080x1920"), "2160x1920");

assert.equal(arrangementByKey("1x3").rows, 1);
assert.equal(arrangementByKey("1x3").cols, 3);
assert.equal(arrangementByKey("does-not-exist").key, "1x3"); // sane fallback, never throws

const screens = autoMapScreens({ rows: 1, cols: 3 }, "1920x1080");
assert.equal(screens.length, 3);
assert.deepEqual(screens[0], { index: 0, resolution: "1920x1080", output: "Output 1" });
assert.deepEqual(screens[2], { index: 2, resolution: "1920x1080", output: "Output 3" });

const config = buildDisplayConfig({ rows: 1, cols: 3 }, screens);
assert.equal(config.mode, "multi");
assert.equal(config.screens.length, 3);

assert.equal(ARRANGEMENT_OPTIONS.length, 6);

console.log("display-config.check.mts — all assertions passed");
