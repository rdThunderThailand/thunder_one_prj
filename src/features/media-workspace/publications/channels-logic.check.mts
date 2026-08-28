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
  formatDeviceSummary,
  selectedChannelDeviceIds,
  statusPercent,
  summarizeGeometryFit,
  toChannelItems,
} from "./channels-logic.ts";
import { channelIdsToTargets } from "./draft-mapping.ts";
import type { ChannelDevice, ChannelListItem } from "../channels/types/index.ts";

function device(id: string, health: ChannelDevice["health"]): ChannelDevice {
  return { id, name: id, code: id, health, last_heartbeat_at: null, orientation: null, resolution: null, sync_phase_error_ms: null, sync_loop_duration_seconds: null };
}

function channel(over: Partial<ChannelListItem> & Pick<ChannelListItem, "id" | "name">): ChannelListItem {
  return {
    description: null,
    lifecycle: "active",
    category: "dooh",
    channel_type: null,
    location: null,
    devices: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-21T00:00:00Z",
    sync_enabled: false,
    direct_target_conflicts: [],
    ...over,
  };
}

// --- formatDeviceSummary ---
assert.equal(formatDeviceSummary([]), "No devices assigned");
assert.equal(formatDeviceSummary([device("a", "online"), device("b", "offline")]), "1/2 devices online");
assert.equal(formatDeviceSummary([device("a", "warning")]), "0/1 devices online");

// --- toChannelItems ---
assert.deepEqual(toChannelItems([]), []);

const channels: ChannelListItem[] = [
  channel({ id: "c1", name: "Lobby", devices: [device("d1", "online")], expected_resolution: "1920x1080" }),
  channel({ id: "c2", name: "Foyer", category: "in_store", devices: [device("d2", "offline"), device("d3", "online")] }),
  channel({ id: "c3", name: "Staged", lifecycle: "draft" }),
  channel({ id: "c4", name: "Empty" }),
];
const items = toChannelItems(channels);

// A Draft Channel holds no device reservations, so it is not publishable.
assert.deepEqual(items.map((i) => i.id), ["c1", "c2", "c4"]);
assert.equal(items[0].status, "online");
assert.equal(items[0].resolution, "1920x1080");
assert.equal(items[0].subLabel, "1/1 devices online");
assert.equal(items[1].status, "warning"); // mixed device health rolls up to warning, never "degraded"
assert.equal(items[1].category, "in-store"); // domain `in_store` -> wizard `in-store`
assert.equal(items[2].status, "offline"); // no devices, no liveness to report

// --- selectedChannelDeviceIds: media_schedule_conflicts is still device-level ---
assert.deepEqual(selectedChannelDeviceIds(channels, []), []);
assert.deepEqual(selectedChannelDeviceIds(channels, ["c1", "c2"]), ["d1", "d2", "d3"]);
assert.deepEqual(selectedChannelDeviceIds(channels, ["c4"]), []); // channel with no devices

// --- channelIdsToTargets: the whole point of this round ---
assert.deepEqual(channelIdsToTargets(["c1"], channels), [
  { target_type: "channel", channel_id: "c1", name: "Lobby" },
]);
// An id the reference load never returned still has to produce a valid target.
assert.deepEqual(channelIdsToTargets(["gone"], channels), [
  { target_type: "channel", channel_id: "gone", name: null },
]);

// --- filterBySearch ---
assert.equal(filterBySearch(items, "lob").length, 1);
assert.equal(filterBySearch(items, "  LOBBY  ").length, 1); // trims + case-insensitive
assert.equal(filterBySearch(items, "nope").length, 0);
assert.equal(filterBySearch(items, "").length, 3);

// --- computeCategoryCounts ---
const counts = computeCategoryCounts(items);
assert.equal(counts.all, 3);
assert.equal(counts.dooh, 2);
assert.equal(counts["in-store"], 1);
assert.equal(counts.social, 0);

// --- computeStatusCounts + statusPercent: zero channels must not divide by zero ---
const empty = computeStatusCounts([]);
assert.deepEqual(empty, { online: 0, warning: 0, offline: 0, total: 0 });
assert.equal(statusPercent(empty.online, empty.total), 0); // NaN guard

const mixed = computeStatusCounts(items);
assert.deepEqual(mixed, { online: 1, warning: 1, offline: 1, total: 3 });
assert.equal(statusPercent(mixed.online, mixed.total), 33);

// --- summarizeGeometryFit ---
const geometryChannels = [
  { id: "c1", devices: [
    { id: "d1", name: "Screen 01", resolution: "1920x1080" },
    { id: "d2", name: "Screen 04", resolution: "1080x1920" },
    { id: "d3", name: "Screen 09", resolution: null },
  ] },
  { id: "c2", devices: [{ id: "d4", name: "Screen 05", resolution: "1024x768" }] },
] as unknown as ChannelListItem[];

assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1"], "16:9"),
  { unfitting: ["Screen 04"], unprofiled: ["Screen 09"] });
assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1", "c2"], "16:9"),
  { unfitting: ["Screen 04", "Screen 05"], unprofiled: ["Screen 09"] });
// No Composition selected: nothing to compare against, nothing to warn about.
assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1"], null),
  { unfitting: [], unprofiled: [] });
// Unselected Channels are not scanned.
assert.deepEqual(summarizeGeometryFit(geometryChannels, [], "16:9"),
  { unfitting: [], unprofiled: [] });

console.log("channels-logic.check.mts — all assertions passed");
