import assert from "node:assert/strict";
import { previewFrameAt, zoneLoopDurationSeconds } from "./preview-clock.ts";

const main = [
  { mediaAssetId: "a", durationSeconds: 12 },
  { mediaAssetId: "b", durationSeconds: 18 },
];
const side = [
  { mediaAssetId: "c", durationSeconds: 5 },
  { mediaAssetId: "d", durationSeconds: 15 },
];

assert.equal(zoneLoopDurationSeconds(main), 30);
assert.deepEqual(previewFrameAt(main, 11.9), { item: main[0], itemIndex: 0, offsetSeconds: 11.9, loopDurationSeconds: 30 });
assert.deepEqual(previewFrameAt(main, 12), { item: main[1], itemIndex: 1, offsetSeconds: 0, loopDurationSeconds: 30 });
assert.equal(previewFrameAt(side, 25).item?.mediaAssetId, "d");
assert.deepEqual(previewFrameAt([{ mediaAssetId: "missing", durationSeconds: null }], 40), {
  item: { mediaAssetId: "missing", durationSeconds: null },
  itemIndex: 0,
  offsetSeconds: 0,
  loopDurationSeconds: 0,
});

console.log("preview-clock.check.mts OK");
