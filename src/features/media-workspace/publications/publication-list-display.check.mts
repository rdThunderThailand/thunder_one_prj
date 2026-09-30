/** Run: node src/features/media-workspace/publications/publication-list-display.check.mts */
import assert from "node:assert/strict";
import {
  deliveryView,
  formatScheduleRange,
  formatTargetSummary,
  rowActionsFor,
} from "./publication-list-display.ts";
import type { PublicationListItem } from "./types";

const base = { id: "p", name: "n", status: "active", publication_type: "playlist", priority: "normal", item_count: 1, tags: [] } as PublicationListItem;

assert.deepEqual(rowActionsFor("draft"), ["edit", "publish", "duplicate", "delete"]);
assert.deepEqual(rowActionsFor("live"), ["open", "duplicate", "end"]);
assert.deepEqual(rowActionsFor("ended"), ["view", "duplicate"]);
assert.ok(!rowActionsFor(undefined).includes("delete"));

// 2025-05-12 17:00Z is already 13 May 00:00 in Bangkok — the range must read in the Program's zone.
assert.equal(
  formatScheduleRange({ ...base, timezone: "Asia/Bangkok", starts_at: "2025-05-12T17:00:00Z", ends_at: "2025-05-31T16:00:00Z" }),
  "13 May 2025 – 31 May 2025"
);
assert.equal(formatScheduleRange({ ...base, starts_at: null }), "Not scheduled");
assert.equal(
  formatScheduleRange({ ...base, timezone: "UTC", starts_at: "2025-05-12T00:00:00Z", ends_at: null }),
  "From 12 May 2025"
);

assert.equal(formatTargetSummary({ ...base, target_summary: { channels: 1, devices: 2 } }), "1 Channel · 2 Devices");
assert.equal(formatTargetSummary({ ...base, target_summary: { channels: 0, devices: 0 } }), "No targets");

assert.equal(deliveryView({ ...base, display_status: "draft", delivery: null }).label, "Not published");
const live = deliveryView({ ...base, display_status: "live", delivery: { total: 8, stage3_done: 8, offline: 0, failed: 0 } });
assert.equal(live.label, "Playing on all");
assert.equal(live.ratio, "8 / 8 (100%)");
const pub = deliveryView({ ...base, display_status: "publishing", delivery: { total: 5, stage3_done: 3, offline: 1, failed: 0 } });
assert.equal(pub.label, "Publishing…");
assert.equal(pub.problems, "1 offline");
assert.equal(deliveryView({ ...base, display_status: "live", delivery: { total: 1, stage3_done: 0, offline: 1, failed: 0 } }).label, "Not playing yet");
assert.equal(deliveryView({ ...base, display_status: "ended", delivery: { total: 1, stage3_done: 0, offline: 0, failed: 0 } }).label, "Ended");
