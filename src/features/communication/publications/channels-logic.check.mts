/**
 * Runnable check for Channels step logic:
 *
 *     node src/features/publications/channels-logic.check.mts
 */
import assert from "node:assert/strict";
import {
  computeCategoryCounts,
  computeStatusCounts,
  filterBySearch,
  formatLastSeen,
  statusPercent,
  toChannelItems,
} from "./channels-logic.ts";
import type { Screen } from "./types/index.ts";

// --- formatLastSeen ---
const NOW = Date.parse("2026-08-04T12:00:00Z");
assert.equal(formatLastSeen(undefined, NOW), "Never connected");
assert.equal(formatLastSeen(null, NOW), "Never connected");
assert.equal(formatLastSeen("2026-08-04T11:59:30Z", NOW), "Last seen just now"); // 30s ago
assert.equal(formatLastSeen("2026-08-04T11:55:00Z", NOW), "Last seen 5m ago");
assert.equal(formatLastSeen("2026-08-04T10:00:00Z", NOW), "Last seen 2h ago");
assert.equal(formatLastSeen("2026-08-01T12:00:00Z", NOW), "Last seen 3d ago");
assert.equal(formatLastSeen("2026-08-04T12:00:30Z", NOW), "Last seen just now"); // future clock skew, not negative minutes

// --- toChannelItems: empty screens ---
assert.deepEqual(toChannelItems([]), []);

// --- toChannelItems: zero-count / missing status_level defaults to offline ---
const screens: Screen[] = [
  { id: "s1", name: "Lobby", status_level: "online", last_heartbeat_at: "2026-08-04T11:58:00Z" },
  { id: "s2", name: "Foyer", last_heartbeat_at: null }, // no status_level
];
const items = toChannelItems(screens, NOW);
assert.equal(items[0].status, "online");
assert.equal(items[1].status, "offline"); // fallback when backend omits status_level
assert.equal(items[1].category, "dooh"); // every screen reads as dooh today
assert.equal(items[1].subLabel, "Never connected");

// --- filterBySearch ---
assert.equal(filterBySearch(items, "lob").length, 1);
assert.equal(filterBySearch(items, "  LOBBY  ").length, 1); // trims + case-insensitive
assert.equal(filterBySearch(items, "nope").length, 0);
assert.equal(filterBySearch(items, "").length, 2);

// --- computeCategoryCounts: everything lands in "dooh" today ---
const counts = computeCategoryCounts(items);
assert.equal(counts.all, 2);
assert.equal(counts.dooh, 2);
assert.equal(counts["in-store"], 0);

// --- computeStatusCounts + statusPercent: zero channels must not divide by zero ---
const empty = computeStatusCounts([]);
assert.deepEqual(empty, { online: 0, warning: 0, offline: 0, total: 0 });
assert.equal(statusPercent(empty.online, empty.total), 0); // NaN guard

const mixed = computeStatusCounts(items);
assert.deepEqual(mixed, { online: 1, warning: 0, offline: 1, total: 2 });
assert.equal(statusPercent(mixed.online, mixed.total), 50);
assert.equal(statusPercent(mixed.offline, mixed.total), 50);

console.log("channels-logic.check.mts — all assertions passed");
