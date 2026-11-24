import * as assert from "node:assert/strict";
import { draftItemsToContentItems, isImageAsset } from "./draft-mapping.ts";
import type { DraftAssetItem, MediaAsset } from "./types/index.ts";

// draftItemsToContentItems
assert.deepEqual(draftItemsToContentItems([]), []);

const items: DraftAssetItem[] = [
  { media_asset_id: "a1", duration_seconds: 10 },
  { media_asset_id: "v1", duration_seconds: null },
  { media_asset_id: "a2", duration_seconds: 5 },
];

assert.deepEqual(draftItemsToContentItems(items), [
  { media_asset_id: "a1", position: 1, duration_seconds: 10 },
  { media_asset_id: "v1", position: 2, duration_seconds: null },
  { media_asset_id: "a2", position: 3, duration_seconds: 5 },
]);

// isImageAsset
const img1: MediaAsset = { id: "1", kind: "image" };
assert.equal(isImageAsset(img1), true);

const vid1: MediaAsset = { id: "2", kind: "video" };
assert.equal(isImageAsset(vid1), false);

const vid2: MediaAsset = { id: "3", file: { mime_type: "video/mp4" } };
assert.equal(isImageAsset(vid2), false);

const img2: MediaAsset = { id: "4", file: { mime_type: "image/png" } };
assert.equal(isImageAsset(img2), true);

console.log("content-items.check.mts: all assertions passed");
