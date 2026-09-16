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
  formatPlayerSummary,
  selectedGroupItems,
  selectedChannelDeviceIds,
  statusPercent,
  summarizeGeometryFit,
  toChannelItems,
} from "./channels-logic.ts";
import type { ChannelDevice, ChannelListItem } from "../channels/types/index.ts";

function device(id: string, health: ChannelDevice["health"], resolution: string | null = null): ChannelDevice {
  return { id, name: id, code: id, health, last_heartbeat_at: null, orientation: null, resolution, sync_phase_error_ms: null, sync_loop_duration_seconds: null };
}

function channel(over: Partial<ChannelListItem> & Pick<ChannelListItem, "id" | "name">): ChannelListItem {
  return {
    description: null,
    lifecycle: "active",
    category: "dooh",
    channel_type: null,
    location: null,
    player: null,
    health: null,
    output_kind: "screen",
    display_config: null,
    groups: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-21T00:00:00Z",
    ...over,
  };
}

// --- formatPlayerSummary ---
assert.equal(formatPlayerSummary(null), "No player assigned");
assert.equal(formatPlayerSummary(device("Screen 01", "online")), "Screen 01 · online");
assert.equal(formatPlayerSummary(device("Screen 02", "warning")), "Screen 02 · warning");

// --- toChannelItems ---
assert.deepEqual(toChannelItems([]), []);

const channels: ChannelListItem[] = [
  channel({ id: "c1", name: "Lobby", player: device("d1", "online"), groups: [{ id: "g1", name: "All Screens", playback_mode: "independent" }], expected_resolution: "1920x1080" }),
  channel({ id: "c2", name: "Foyer", category: "in_store", player: device("d2", "warning"), groups: [{ id: "g1", name: "All Screens", playback_mode: "independent" }] }),
  channel({ id: "c3", name: "Staged", lifecycle: "draft" }),
  channel({ id: "c4", name: "Empty" }),
];
const items = toChannelItems(channels);

// A Draft Channel holds no device reservations, so it is not publishable.
assert.deepEqual(items.map((i) => i.id), ["c1", "c2", "c4"]);
assert.equal(items[0].status, "online");
assert.equal(items[0].resolution, "1920x1080");
assert.equal(items[0].subLabel, "d1 · online");
assert.equal(items[1].status, "warning"); // the Player's health is the card status (ADR 0074 §4)
assert.equal(items[1].category, "in-store"); // domain `in_store` -> wizard `in-store`
assert.equal(items[2].status, "offline"); // no Player, no liveness to report

// --- selectedChannelDeviceIds: media_schedule_conflicts is still device-level ---
assert.deepEqual(selectedChannelDeviceIds(channels, []), []);
assert.deepEqual(selectedChannelDeviceIds(channels, ["c1", "c2"]), ["d1", "d2"]);
assert.deepEqual(selectedChannelDeviceIds(channels, ["c4"]), []); // channel with no Player
assert.deepEqual(selectedGroupItems(channels, ["g1"], {}), [
  { id: "g1", name: "All Screens", channelCount: 2 },
]);
assert.deepEqual(selectedGroupItems(channels, ["gone"], { gone: "Saved Group" }), [
  { id: "gone", name: "Saved Group", channelCount: 0 },
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
// Canvas unset: the Player's own reported resolution is compared; null reads as unprofiled.
const geometryChannels: ChannelListItem[] = [
  channel({ id: "c1", name: "c1", player: device("Screen 04", "online", "1080x1920") }),
  channel({ id: "c2", name: "c2", player: device("Screen 05", "online", "1024x768") }),
  channel({ id: "c3", name: "c3", player: device("Screen 09", "online", null) }),
  channel({ id: "c4", name: "c4", player: device("Screen 01", "online", "1920x1080") }),
  channel({ id: "c5", name: "c5" }),
];

assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1", "c3", "c4"], "16:9"),
  { unfitting: ["Screen 04"], unprofiled: ["Screen 09"] });
assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1", "c2", "c3"], "16:9"),
  { unfitting: ["Screen 04", "Screen 05"], unprofiled: ["Screen 09"] });
// No Composition selected: nothing to compare against, nothing to warn about.
assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c1"], null),
  { unfitting: [], unprofiled: [] });
// Unselected Channels and Player-less Channels are not scanned.
assert.deepEqual(summarizeGeometryFit(geometryChannels, [], "16:9"),
  { unfitting: [], unprofiled: [] });
assert.deepEqual(summarizeGeometryFit(geometryChannels, ["c5"], "16:9"),
  { unfitting: [], unprofiled: [] });

// Canvas set (ADR 0074 §3): the Player is checked against the declared canvas, not its own
// reported resolution — a canvas that fits clears a Player that would individually have read as
// unfitting/unprofiled.
const canvasSetChannels: ChannelListItem[] = [
  channel({ id: "c1", name: "c1", expected_resolution: "1920x1080", player: device("Screen 01", "online", "1024x768") }),
  channel({ id: "c2", name: "c2", expected_resolution: "1920x1080", player: device("Screen 02", "online", null) }),
];
assert.deepEqual(summarizeGeometryFit(canvasSetChannels, ["c1", "c2"], "16:9"), { unfitting: [], unprofiled: [] });

console.log("channels-logic.check.mts — all assertions passed");
