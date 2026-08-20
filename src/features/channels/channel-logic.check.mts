/** Run: node src/features/channels/channel-logic.check.mts */
import assert from "node:assert/strict";
import {
  deriveChannelHealth,
  filterChannels,
  formatChannelLastSeen,
  getDeviceCompatibility,
  mergeChannelDeviceCandidates,
  mergeChannelTypeOptions,
  shouldConfirmResolutionMismatch,
  summarizeChannels,
  validateChannelDraft,
} from "./domain.ts";
import type { ChannelListItem } from "./domain.ts";

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
        id: "device-siam-north",
        name: "North LED Screen",
        code: "SS-LED-NORTH",
        health: "online",
        last_heartbeat_at: "2026-08-20T00:00:00.000Z",
        orientation: "landscape",
        resolution: "3840x2160",
      },
      {
        id: "device-siam-south",
        name: "South LED Screen",
        code: "SS-LED-SOUTH",
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
    id: "channel-draft-dooh",
    name: "Rama Nine LED Display",
    description: null,
    lifecycle: "draft",
    health: "online",
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
      },
    ],
    expected_orientation: "portrait",
    expected_resolution: "1080x1920",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-inactive-in-store",
    name: "Archive Menu Board",
    description: null,
    lifecycle: "inactive",
    health: null,
    category: "in_store",
    channel_type: { id: "type-menu-board", code: "menu_board", name: "Menu Board", channel_category: "in_store" },
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
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, category: "dooh" }).map((channel) => channel.id), [
  "channel-active-dooh",
  "channel-draft-dooh",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, lifecycle: "draft" }).map((channel) => channel.id), [
  "channel-draft-dooh",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, health: "degraded" }).map((channel) => channel.id), [
  "channel-active-dooh",
]);
assert.deepEqual(filterChannels(fixtures, { ...allFilters, health: "unknown" }).map((channel) => channel.id), [
  "channel-inactive-in-store",
]);

assert.deepEqual(
  validateChannelDraft({
    name: "",
    category: "in_store",
    channel_type_id: "",
    device_ids: [],
    confirm_mismatch: false,
  }),
  { name: "กรุณาระบุชื่อ Channel", channel_type_id: "กรุณาเลือก Channel Type" },
);

const partialProfileDevice = {
  id: "device-partial",
  name: "Partial Profile Screen",
  code: null,
  health: "online" as const,
  last_heartbeat_at: null,
  orientation: "portrait" as const,
  resolution: null,
};

assert.equal(
  getDeviceCompatibility(partialProfileDevice, "landscape", "1920x1080"),
  "orientation-mismatch",
);
assert.equal(
  getDeviceCompatibility(
    { ...partialProfileDevice, orientation: null, resolution: "1280x720" },
    "landscape",
    "1920x1080",
  ),
  "resolution-mismatch",
);
assert.equal(
  getDeviceCompatibility(
    { ...partialProfileDevice, resolution: "1280x720" },
    "landscape",
    "1920x1080",
  ),
  "orientation-mismatch",
);
assert.equal(
  getDeviceCompatibility(
    { ...partialProfileDevice, orientation: "landscape", resolution: null },
    "landscape",
    "1920x1080",
  ),
  "profile-unavailable",
);
assert.equal(
  getDeviceCompatibility(
    { ...partialProfileDevice, orientation: "landscape", resolution: "1920x1080" },
    "landscape",
    "1920x1080",
  ),
  "compatible",
);
assert.equal(getDeviceCompatibility(partialProfileDevice, null, null), "not-checked");
assert.equal(
  shouldConfirmResolutionMismatch(
    [{ ...partialProfileDevice, orientation: null, resolution: "1280x720" }],
    "1920x1080",
    new Set(["device-partial"]),
  ),
  true,
);
assert.equal(
  shouldConfirmResolutionMismatch(
    [{ ...partialProfileDevice, orientation: null, resolution: "1280x720" }],
    "1920x1080",
    new Set(),
  ),
  false,
);
assert.equal(
  shouldConfirmResolutionMismatch(
    [{ ...partialProfileDevice, orientation: "landscape", resolution: "1920x1080" }],
    "1920x1080",
    new Set(),
  ),
  false,
);

assert.deepEqual(
  mergeChannelDeviceCandidates(
    [
      {
        id: "device-assigned",
        name: "Live Screen Name",
        code: null,
        health: "warning",
        last_heartbeat_at: "2026-08-20T03:00:00.000Z",
        orientation: null,
        resolution: null,
      },
    ],
    [
      {
        id: "device-assigned",
        name: "Assigned Screen Name",
        code: "CW-01",
        health: "offline",
        last_heartbeat_at: "2026-08-19T03:00:00.000Z",
        orientation: "landscape",
        resolution: "1920x1080",
      },
    ],
  ),
  [
    {
      id: "device-assigned",
      name: "Live Screen Name",
      code: "CW-01",
      health: "warning",
      last_heartbeat_at: "2026-08-20T03:00:00.000Z",
      orientation: "landscape",
      resolution: "1920x1080",
    },
  ],
);

const currentInactiveType = {
  id: "type-current-inactive",
  code: "legacy_menu_board",
  name: "Legacy Menu Board",
  channel_category: "in_store" as const,
};
assert.deepEqual(mergeChannelTypeOptions([], currentInactiveType), [
  { ...currentInactiveType, is_active: false },
]);
assert.deepEqual(
  mergeChannelTypeOptions(
    [{ ...currentInactiveType, name: "Current Reference Name", is_active: false }],
    currentInactiveType,
  ),
  [{ ...currentInactiveType, name: "Current Reference Name", is_active: false }],
);

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
