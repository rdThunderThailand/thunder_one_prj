import assert from "node:assert/strict";
import type { CompositionLibraryItem } from "../compositions/types";
import { defaultCompositionPickerFilters, filterCompositionPickerItems, publishableCompositions } from "./composition-picker-filter.ts";

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
console.log("composition-picker-filter checks passed");
