/** Run: node src/features/playlists/totals.check.mts */
import assert from "node:assert/strict";
import { formatBytes, computePlaylistTotals } from "./totals.ts";
import type { MediaAsset } from "../../types/domain.ts";

assert.equal(formatBytes(500), "500 B");
assert.equal(formatBytes(1536), "2 KB");
assert.equal(formatBytes(1_363_149), "1.3 MB");

const items = [
  { media_asset_id: "a-1", duration_seconds: 6 },
  { media_asset_id: "a-2", duration_seconds: null }, // falls back to the asset's own length
  { media_asset_id: "a-3", duration_seconds: 6 }, // asset missing from the join
];

const assetsById: Record<string, MediaAsset | undefined> = {
  "a-1": { id: "a-1", file: { file_size_bytes: 1_363_149 } },
  "a-2": { id: "a-2", duration_seconds: 10, file: { file_size_bytes: 500 } },
};

const totals = computePlaylistTotals(items, assetsById);
assert.equal(totals.fileCount, 3);
assert.equal(totals.isPartial, true);
assert.equal(totals.sizeLabel, "1.3 MB+"); // a-3 excluded, not counted as 0
assert.equal(totals.durationLabel, "00:00:22"); // 6 + 10 + 6

const complete = computePlaylistTotals(
  items.slice(0, 2),
  { "a-1": assetsById["a-1"], "a-2": assetsById["a-2"] }
);
assert.equal(complete.isPartial, false);
assert.equal(complete.sizeLabel, "1.3 MB");

console.log("totals.check.mts — all assertions passed");
