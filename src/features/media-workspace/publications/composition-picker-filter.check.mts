import assert from "node:assert/strict";
import type { CompositionLibraryItem } from "../compositions/types";
import { compositionLayoutDisplayName, defaultCompositionPickerFilters, filterCompositionPickerItems, publishableCompositions } from "./composition-picker-filter.ts";

const base = { layout_id: "l", revision: 1, zone_count: 2, bound_count: 2 };
const rows: CompositionLibraryItem[] = [
  { ...base, id: "a", name: "Lobby Wall", layout_name: "Split", status: "active", referenceResolution: "1920x1080", tags: [{ id: "t1", name: "Retail" }] },
  { ...base, id: "b", name: "Portrait Menu", layout_name: "Single", status: "inactive", referenceResolution: "1080x1920", tags: [] },
  { ...base, id: "c", name: "Draft One", layout_name: "Split", status: "draft", referenceResolution: "1920x1080", tags: [] },
];

assert.deepEqual(publishableCompositions(rows).map((r) => r.id), ["a", "b"]);
assert.deepEqual(filterCompositionPickerItems(rows, { ...defaultCompositionPickerFilters, query: "retail" }).map((r) => r.id), ["a"]);
assert.deepEqual(filterCompositionPickerItems(rows, { ...defaultCompositionPickerFilters, orientation: "portrait" }).map((r) => r.id), ["b"]);
assert.deepEqual(filterCompositionPickerItems(rows, { ...defaultCompositionPickerFilters, status: "active", aspectRatio: "1920x1080" }).map((r) => r.id), ["a"]);

const presetCopy: CompositionLibraryItem = {
  ...base,
  id: "preset-copy",
  name: "Header content",
  layout_name: "comp:411dccae-54e3-4cd7-9f92-eeb21934d674",
  status: "active",
  referenceResolution: "1920x1080",
  previewZones: [
    { position: 0, x: 0, y: 0, width: 100, height: 15, firstAssetId: null },
    { position: 1, x: 0, y: 15, width: 70, height: 85, firstAssetId: null },
    { position: 2, x: 70, y: 15, width: 30, height: 85, firstAssetId: null },
  ],
};

assert.equal(compositionLayoutDisplayName(presetCopy), "3-Zone Header");
assert.equal(compositionLayoutDisplayName({
  ...presetCopy,
  previewZones: [{ ...presetCopy.previewZones![0], width: 90 }],
}), "Custom layout");
assert.deepEqual(filterCompositionPickerItems([presetCopy], { ...defaultCompositionPickerFilters, query: "3-zone header" }).map((r) => r.id), ["preset-copy"]);
console.log("composition-picker-filter checks passed");
