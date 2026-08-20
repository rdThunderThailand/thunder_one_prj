/** Run: node src/features/channels/channel-logic.check.mts */
import assert from "node:assert/strict";
import {
  deriveChannelHealth,
  filterChannels,
  formatChannelLastSeen,
  summarizeChannels,
  validateChannelDraft,
} from "./index.ts";
import type { ChannelListItem } from "./index.ts";

const fixtures: ChannelListItem[] = [
  {
    id: "channel-active-in-store",
    name: "Flagship Store Channel",
    description: null,
    lifecycle: "active",
    health: "online",
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
      },
    ],
    expected_orientation: "landscape",
    expected_resolution: "1920x1080",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-active-dooh",
    name: "Siam Square Billboard",
    description: null,
    lifecycle: "active",
    health: "degraded",
    category: "dooh",
    channel_type: { id: "type-led-display", code: "led_display", name: "LED Display", channel_category: "dooh" },
    location: { id: "location-siam", name: "Siam Square" },
    devices: [
      {
        id: "device-siam-primary",
        name: "Primary LED Screen",
        code: "SS-LED-PRIMARY",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "landscape",
        resolution: "3840x2160",
      },
      {
        id: "device-siam-backup",
        name: "Backup LED Screen",
        code: "SS-LED-BACKUP",
        health: "offline",
        last_heartbeat_at: "2026-08-19T22:00:00.000Z",
        orientation: "landscape",
        resolution: "1920x1080",
      },
    ],
    expected_orientation: "landscape",
    expected_resolution: "3840x2160",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-draft-social",
    name: "Social Mall Display",
    description: null,
    lifecycle: "draft",
    health: "online",
    category: "social",
    channel_type: { id: "type-social-led", code: "led_display", name: "LED Display", channel_category: "social" },
    location: { id: "location-social-mall", name: "Social Mall" },
    devices: [
      {
        id: "device-social-mall",
        name: "Atrium LED Screen",
        code: "SM-LED-01",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "portrait",
        resolution: "1080x1920",
      },
    ],
    expected_orientation: "portrait",
    expected_resolution: "1080x1920",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-inactive-online",
    name: "Online Archive Display",
    description: null,
    lifecycle: "inactive",
    health: null,
    category: "online",
    channel_type: { id: "type-online-led", code: "led_display", name: "LED Display", channel_category: "online" },
    location: null,
    devices: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
];

const allFilters = { search: "", category: "all", lifecycle: "all", health: "all" } as const;

assert.equal(deriveChannelHealth([]), null);
assert.equal(deriveChannelHealth(["online", "online"]), "online");
assert.equal(deriveChannelHealth(["online", "warning"]), "warning");
assert.equal(deriveChannelHealth(["warning", "warning"]), "warning");
assert.equal(deriveChannelHealth(["online", "offline"]), "degraded");
assert.equal(deriveChannelHealth(["warning", "offline"]), "degraded");
assert.equal(deriveChannelHealth(["offline", "offline"]), "offline");

assert.deepEqual(summarizeChannels(fixtures), {
  lifecycle: { total: 4, draft: 1, active: 2, inactive: 1 },
  health: { online: 2, warning: 0, degraded: 1, offline: 0, unknown: 1 },
  unassigned: 1,
});

assert.deepEqual(
  filterChannels(fixtures, {
    search: "central world",
    category: "in_store",
    lifecycle: "active",
    health: "all",
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
assert.deepEqual(filterChannels(fixtures, { ...allFilters, category: "social" }).map((channel) => channel.id), [
  "channel-draft-social",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, lifecycle: "draft" }).map((channel) => channel.id), [
  "channel-draft-social",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, health: "degraded" }).map((channel) => channel.id), [
  "channel-active-dooh",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, health: "unknown" }).map((channel) => channel.id), [
  "channel-inactive-online",
]);

assert.deepEqual(
  validateChannelDraft({ name: "", category: "in_store", channel_type_id: "", device_ids: [] }),
  { name: "กรุณาระบุชื่อ Channel", channel_type_id: "กรุณาเลือก Channel Type" },
);

assert.equal(
  formatChannelLastSeen(fixtures[0]!.devices[0]!.last_heartbeat_at, Date.parse("2026-08-20T00:00:00.000Z")),
  "Last seen just now",
);
assert.equal(
  formatChannelLastSeen(fixtures[0]!.devices[0]!.last_heartbeat_at, Date.parse("2026-08-20T00:01:00.000Z")),
  "Last seen 1m ago",
);

console.log("channel-logic.check.mts — all assertions passed");
