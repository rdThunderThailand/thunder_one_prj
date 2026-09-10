import assert from "node:assert/strict";
import { filterAssets, type AssetPickerFilters } from "./asset-filter.ts";

const filters: AssetPickerFilters = { query: "", kind: "all", folderId: "all", tagId: null, status: "all", resolution: "all", minDuration: "", maxDuration: "" };
const assets = [
  { id: "one", title: "Lobby welcome", kind: "video" as const, status: "ready", folder_id: "f1", width: 1920, height: 1080, duration_seconds: 30, tags: [{ id: "t1", name: "Lobby" }] },
  { id: "two", title: "Menu", kind: "image" as const, status: "draft", folder_id: null, width: 1080, height: 1920, duration_seconds: null, tags: [{ id: "t2", name: "Food" }] },
];

assert.deepEqual(filterAssets(assets, { ...filters, query: "welcome", kind: "video", folderId: "f1", tagId: "t1", status: "ready", resolution: "1920x1080", minDuration: "20", maxDuration: "40" }).map((asset) => asset.id), ["one"]);
assert.deepEqual(filterAssets(assets, { ...filters, folderId: "uncategorized" }).map((asset) => asset.id), ["two"]);
assert.deepEqual(filterAssets(assets, { ...filters, minDuration: "1" }).map((asset) => asset.id), ["one"]);
