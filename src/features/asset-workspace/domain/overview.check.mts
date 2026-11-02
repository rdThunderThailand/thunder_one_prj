/** Run: node src/features/asset-workspace/domain/overview.check.mts */
import assert from "node:assert/strict";
import { attentionRows, breakdown, kpiFromCounts, type AttentionRow } from "./overview.ts";

// Total leaves Disposed out; percents are shares of that Total.
const kpi = kpiFromCounts({ Available: 21, Assigned: 470, "In Maintenance": 5, Retired: 4, Disposed: 9 });
assert.equal(kpi.total, 500);
assert.deepEqual(
  kpi.tiles.map((t) => [t.status, t.count, t.percent]),
  [
    ["Available", 21, 4.2],
    ["Assigned", 470, 94],
    ["In Maintenance", 5, 1],
    ["Retired", 4, 0.8],
  ],
);
assert.equal(kpiFromCounts({}).tiles[0].percent, 0);
assert.equal(kpi.totalDelta, null);
assert.equal(kpi.tiles[0].delta, null);

// vs last month: now minus last month's closing count; a status missing last month counts as 0.
const trend = kpiFromCounts({ Available: 142, Assigned: 44 }, { Available: 134, Assigned: 40, Disposed: 3 });
assert.equal(trend.totalDelta, 12);
assert.deepEqual(
  trend.tiles.map((t) => t.delta),
  [8, 4, 0, 0],
);

// Top 6, then Others, then Unassigned; zero rows dropped.
const items = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id, i) => ({ id, label: id.toUpperCase(), count: 10 - i }));
const rows = breakdown([...items, { id: "z", label: "Z", count: 0 }], 100);
assert.deepEqual(
  rows.map((r) => [r.id, r.label, r.count]),
  [
    ["a", "A", 10],
    ["b", "B", 9],
    ["c", "C", 8],
    ["d", "D", 7],
    ["e", "E", 6],
    ["f", "F", 5],
    [null, "Others", 7],
    [null, "Unassigned", 48],
  ],
);
// Today's develop data: 6 of 509 assets have a location.
assert.deepEqual(
  breakdown([{ id: "x", label: "HQ", count: 6 }], 509).map((r) => [r.label, r.count]),
  [
    ["HQ", 6],
    ["Unassigned", 503],
  ],
);
assert.deepEqual(breakdown([], 0), []);

// Attention: merged, sorted by date, capped at 5.
const row = (id: string, date: string, reason: AttentionRow["reason"]): AttentionRow => ({
  assetId: id,
  assetName: id,
  assetTag: null,
  category: null,
  location: null,
  reason,
  date,
});
const merged = attentionRows(
  [row("w1", "2026-11-20", "Warranty expiring"), row("w2", "2026-11-02", "Warranty expiring")],
  [1, 2, 3, 4].map((n) => row(`m${n}`, `2026-10-0${n}`, "In Maintenance")),
);
assert.deepEqual(
  merged.map((r) => r.assetId),
  ["m1", "m2", "m3", "m4", "w2"],
);

console.log("overview.check: ok");
