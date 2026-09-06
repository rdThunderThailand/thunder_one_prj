/** Run: node src/features/media-workspace/layouts/template-picker.check.mts */
import assert from "node:assert/strict";
import type { LayoutListItem } from "./types/index.ts";
import {
  DEFAULT_PICKER_FILTERS,
  allUseCases,
  filterEntries,
  groupEntries,
  toPickerEntries,
} from "./template-picker.ts";

const templates: LayoutListItem[] = [
  {
    id: "t1", name: "Menu Board A", aspect_ratio: "9:16", background: "#000", status: "active",
    kind: "template", zone_count: 3, zones: [], last_used_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "t2", name: "Lobby", aspect_ratio: "16:9", background: "#000", status: "active",
    kind: "template", zone_count: 2, zones: [], last_used_at: "2026-09-05T00:00:00Z",
  },
  {
    id: "t3", name: "Retired", aspect_ratio: "16:9", background: "#000", status: "inactive",
    kind: "template", zone_count: 1, zones: [], last_used_at: null,
  },
];

const entries = toPickerEntries(templates);

// 14 presets + 2 active templates; the inactive one is dropped.
assert.equal(entries.length, 16);
assert.equal(entries.filter((e) => e.source === "template").length, 2);

// Presets copy their geometry; operator Templates are shared.
assert.ok(entries.filter((e) => e.source === "preset").every((e) => e.behaviour === "copied"));
assert.ok(entries.filter((e) => e.source === "template").every((e) => e.behaviour === "shared"));

// Orientation derived from aspect_ratio for a Template.
assert.equal(entries.find((e) => e.id === "t1")?.orientation, "portrait");
assert.equal(entries.find((e) => e.id === "t2")?.orientation, "landscape");

const groups = groupEntries(entries);
assert.equal(groups.recommended.length, 14);
assert.equal(groups.myTemplates.length, 2);
assert.equal(groups.all.length, 16);
// Recently Used: only Templates with a last_used_at, newest first.
assert.deepEqual(groups.recentlyUsed.map((e) => e.id), ["t2", "t1"]);

// Orientation filter.
assert.ok(
  filterEntries(entries, { ...DEFAULT_PICKER_FILTERS, orientation: "portrait" })
    .every((e) => e.orientation === "portrait"),
);

// Zone-count bucket: "4+" catches the 4 Grid presets.
const fourPlus = filterEntries(entries, { ...DEFAULT_PICKER_FILTERS, zoneCount: "4+" });
assert.ok(fourPlus.length > 0 && fourPlus.every((e) => e.zoneCount >= 4));

// Use-case filter runs over the preset vocabulary only.
assert.ok(allUseCases(entries).includes("Menu board"));
const menu = filterEntries(entries, { ...DEFAULT_PICKER_FILTERS, useCase: "Menu board" });
assert.ok(menu.length > 0 && menu.every((e) => e.useCases.includes("Menu board")));

// Free-text search covers name and description, not use cases.
const byDesc = filterEntries(entries, { ...DEFAULT_PICKER_FILTERS, search: "quadrant" });
assert.ok(byDesc.length > 0 && byDesc.every((e) => /quadrant/i.test(e.description ?? "")));
assert.equal(filterEntries(entries, { ...DEFAULT_PICKER_FILTERS, search: "Lobby" }).length, 1);

console.log("template-picker.check.mts — all assertions passed");
