import assert from "node:assert/strict";
import { acceptedAssetKind, canSelectAsset, canSelectPlaylist, dropMismatchedItems } from "./content-selection.ts";
import type { DraftAssetItem, MediaAsset } from "./types/index.ts";

function imageAsset(id: string): MediaAsset {
  return { id, kind: "image" } as MediaAsset;
}

function videoAsset(id: string): MediaAsset {
  // kind isn't strictly necessary if mime type is video/mp4, but we use kind: "video" to represent a video asset
  // based on the draft-mapping.ts isImageAsset implementation.
  return { id, file: { mime_type: "video/mp4" } } as MediaAsset;
}

const item = (media_asset_id: string): DraftAssetItem => ({
  media_asset_id,
  duration_seconds: null,
});

// 1. acceptedAssetKind for all five publication types.
assert.equal(acceptedAssetKind("image"), "image");
assert.equal(acceptedAssetKind("video"), "video");
assert.equal(acceptedAssetKind("playlist"), null);
assert.equal(acceptedAssetKind("html"), null);
assert.equal(acceptedAssetKind("dynamic"), null);

// 2. canSelectAsset accepts a matching asset and rejects a mismatched one, for both image and video publications.
assert.equal(canSelectAsset("image", imageAsset("a")), true);
assert.equal(canSelectAsset("image", videoAsset("b")), false);

assert.equal(canSelectAsset("video", videoAsset("a")), true);
assert.equal(canSelectAsset("video", imageAsset("b")), false);

// 3. dropMismatchedItems removes a mismatched item, keeps a matching one, and keeps an item whose asset is not in the assets array.
const items = [item("ok-img"), item("bad-vid"), item("missing")];
const assets = [imageAsset("ok-img"), videoAsset("bad-vid")];

assert.deepEqual(
  dropMismatchedItems("image", items, assets),
  [item("ok-img"), item("missing")]
);

assert.deepEqual(
  dropMismatchedItems("video", items, assets),
  [item("bad-vid"), item("missing")]
);

// 4. canSelectPlaylist is only true for publication_type = playlist.
assert.equal(canSelectPlaylist("playlist"), true);
assert.equal(canSelectPlaylist("image"), false);
assert.equal(canSelectPlaylist("video"), false);
assert.equal(canSelectPlaylist("html"), false);
assert.equal(canSelectPlaylist("dynamic"), false);

console.log("content-selection.check.mts — all assertions passed");
