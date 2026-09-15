/** Run: node src/features/channels/channel-logic.check.mts */
import assert from "node:assert/strict";
import {
  channelStatus,
  channelTypeKey,
  channelTypeLabel,
  filterChannels,
  findChannelAttention,
  formatChannelLastSeen,
  summarizeChannels,
} from "./domain.ts";
import type { ChannelListItem } from "./domain.ts";

const fixtures: ChannelListItem[] = [
  {
    id: "channel-active-in-store",
    name: "Flagship Store Channel",
    description: null,
    lifecycle: "active",
    category: "in_store",
    channel_type: { id: "type-menu-board", code: "menu_board", name: "Menu Board", channel_category: "in_store" },
    location: { id: "location-central-world", name: "Central World" },
    devices: [
      {
        id: "device-central-world",
        name: "Entrance Screen",
        code: "CW-ENTRANCE",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "landscape",
        resolution: "1920x1080",
        sync_phase_error_ms: null,
        sync_loop_duration_seconds: null,
      },
    ],
    player: null,
    health: "online",
    output_kind: "kiosk",
    display_config: null,
    expected_orientation: "landscape",
    expected_resolution: "1920x1080",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
    sync_enabled: false,
    direct_target_conflicts: [],
  },
  {
    id: "channel-active-dooh",
    name: "Siam Square Billboard",
    description: null,
    lifecycle: "active",
    category: "dooh",
    channel_type: { id: "type-led-display", code: "led_display", name: "LED Display", channel_category: "dooh" },
    location: { id: "location-siam", name: "Siam Square" },
    devices: [
      {
        id: "device-siam-north",
        name: "North LED Screen",
        code: "SS-LED-NORTH",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "landscape",
        resolution: "3840x2160",
        sync_phase_error_ms: null,
        sync_loop_duration_seconds: null,
      },
      {
        id: "device-siam-south",
        name: "South LED Screen",
        code: "SS-LED-SOUTH",
        health: "offline",
        last_heartbeat_at: "2026-08-19T22:00:00.000Z",
        orientation: "landscape",
        resolution: "1920x1080",
        sync_phase_error_ms: null,
        sync_loop_duration_seconds: null,
      },
    ],
    // Legacy 2-device fixture (pre-M1b shape); ADR 0074 §7 says the frontend must read this from
    // `devices[]`, never treat one as the Player.
    player: null,
    health: "warning",
    output_kind: "screen",
    display_config: null,
    expected_orientation: "landscape",
    expected_resolution: "3840x2160",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
    sync_enabled: false,
    direct_target_conflicts: [],
  },
  {
    id: "channel-draft-dooh",
    name: "Rama Nine LED Display",
    description: null,
    lifecycle: "draft",
    category: "dooh",
    channel_type: { id: "type-led-display", code: "led_display", name: "LED Display", channel_category: "dooh" },
    location: { id: "location-rama-nine", name: "Rama Nine" },
    devices: [
      {
        id: "device-rama-nine",
        name: "West LED Screen",
        code: "RN-LED-01",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "portrait",
        resolution: "1080x1920",
        sync_phase_error_ms: null,
        sync_loop_duration_seconds: null,
      },
    ],
    player: null,
    health: "online",
    output_kind: "screen",
    display_config: {
      mode: "multi",
      arrangement: { rows: 1, cols: 2 },
      screens: [
        { index: 0, resolution: "1080x1920", output: "HDMI 1" },
        { index: 1, resolution: "1080x1920", output: "HDMI 2" },
      ],
    },
    expected_orientation: "portrait",
    expected_resolution: "1080x1920",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
    sync_enabled: false,
    direct_target_conflicts: [],
  },
  {
    id: "channel-inactive-in-store",
    name: "Archive Menu Board",
    description: null,
    lifecycle: "inactive",
    category: "in_store",
    channel_type: { id: "type-menu-board", code: "menu_board", name: "Menu Board", channel_category: "in_store" },
    location: null,
    devices: [],
    player: null,
    health: null,
    output_kind: "screen",
    display_config: null,
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
    sync_enabled: false,
    direct_target_conflicts: [],
  },
];

const allFilters = { search: "", type: "all", status: "all", lifecycle: "all" } as const;

// channelStatus / channelTypeKey / channelTypeLabel — ADR 0074 §4/§3.
assert.equal(channelStatus(fixtures[0]!), "online");
assert.equal(channelStatus(fixtures[3]!), "no_player"); // no devices, health: null
assert.equal(channelTypeKey(fixtures[0]!), "kiosk");
assert.equal(channelTypeKey(fixtures[2]!), "multi"); // display_config.mode wins over output_kind
assert.equal(channelTypeLabel(fixtures[0]!), "Kiosk");
assert.equal(channelTypeLabel(fixtures[1]!), "Screen");
assert.equal(channelTypeLabel(fixtures[2]!), "Multi-screen");

const summary = summarizeChannels(fixtures);
// health: online, warning, online, null — a Player-less Draft counts only in `total`.
assert.deepEqual(summary, { total: 4, online: 2, warning: 1, offline: 0 });
assert.deepEqual(findChannelAttention(fixtures).map(({ device }) => device.id), ["device-siam-south"]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "offline" }).map((channel) => channel.id), ["channel-active-dooh"]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "attention" }).map((channel) => channel.id), ["channel-active-dooh"]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, status: "no_player" }).map((channel) => channel.id), ["channel-inactive-in-store"]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, type: "multi" }).map((channel) => channel.id), ["channel-draft-dooh"]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, type: "kiosk" }).map((channel) => channel.id), ["channel-active-in-store"]);

assert.deepEqual(
  filterChannels(fixtures, {
    search: "central world",
    type: "kiosk",
    status: "all",
    lifecycle: "active",
  }).map((channel) => channel.id),
  ["channel-active-in-store"],
);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "  FLAGSHIP STORE  " }).map((channel) => channel.id), [
  "channel-active-in-store",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "CENTRAL WORLD" }).map((channel) => channel.id), [
  "channel-active-in-store",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "ENTRANCE SCREEN" }).map((channel) => channel.id), [
  "channel-active-in-store",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, search: "cw-entrance" }).map((channel) => channel.id), [
  "channel-active-in-store",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, type: "tv" }).map((channel) => channel.id), [
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, type: "screen" }).map((channel) => channel.id), [
  "channel-active-dooh",
  "channel-inactive-in-store",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, lifecycle: "draft" }).map((channel) => channel.id), [
  "channel-draft-dooh",
]);

assert.equal(formatChannelLastSeen(null), "Never connected");
assert.equal(
  formatChannelLastSeen(fixtures[0]!.devices[0]!.last_heartbeat_at, Date.parse("2026-08-20T00:00:00.000Z")),
  "Last seen just now",
);
assert.equal(
  formatChannelLastSeen(fixtures[0]!.devices[0]!.last_heartbeat_at, Date.parse("2026-08-20T00:01:00.000Z")),
  "Last seen 1m ago",
);

console.log("channel-logic.check.mts — all assertions passed");
