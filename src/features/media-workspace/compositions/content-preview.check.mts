import assert from "node:assert/strict";
import { firstPlaylistAssetId } from "./content-preview.ts";

assert.equal(firstPlaylistAssetId([]), undefined);
assert.equal(firstPlaylistAssetId([
  { media_asset_id: "second", position: 1 },
  { media_asset_id: "first", position: 0 },
]), "first");
console.log("content-preview.check.mts OK");
