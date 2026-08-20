/** Run: node src/features/channels/channel-logic.check.mts */
import assert from "node:assert/strict";
import {
  deriveChannelHealth,
  filterChannels,
  formatChannelLastSeen,
  summarizeChannels,
  validateChannelDraft,
} from "./channel-logic.ts";
import type { ChannelListItem } from "./types/index.ts";

const fixtures: ChannelListItem[] = [
  {
    id: "channel-active-in-store",
    name: "Central World Ground Floor",
    description: null,
    lifecycle: "active",
    health: "online",
    category: "in_store",
    channel_type: { id: "type-in-store", code: "IN_STORE", name: "In Store" },
    location: { id: "location-central-world", name: "Central World" },
    devices: [{ id: "device-central-world", name: "Entrance Screen", code: "CW-ENTRANCE", health: "online" }],
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
    channel_type: { id: "type-dooh", code: "DOOH", name: "DOOH" },
    location: { id: "location-siam", name: "Siam Square" },
    devices: [
      { id: "device-siam-primary", name: "Primary Screen", code: "SS-PRIMARY", health: "online" },
      { id: "device-siam-backup", name: "Backup Screen", code: "SS-BACKUP", health: "offline" },
    ],
    expected_orientation: "landscape",
    expected_resolution: "3840x2160",
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-draft-online",
    name: "Online Launch",
    description: null,
    lifecycle: "draft",
    health: null,
    category: "online",
    channel_type: null,
    location: null,
    devices: [{ id: "device-social", name: "Social Connector", code: "SOCIAL-1", health: "online" }],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "channel-inactive-social",
    name: "Social Archive",
    description: null,
    lifecycle: "inactive",
    health: null,
    category: "social",
    channel_type: null,
    location: null,
    devices: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist: null,
    revision: 1,
    updated_at: "2026-08-20T00:00:00.000Z",
  },
];

assert.equal(deriveChannelHealth([]), null);
assert.equal(deriveChannelHealth(["online", "online"]), "online");
assert.equal(deriveChannelHealth(["online", "warning"]), "warning");
assert.equal(deriveChannelHealth(["online", "offline"]), "degraded");
assert.equal(deriveChannelHealth(["offline", "offline"]), "offline");

assert.deepEqual(summarizeChannels(fixtures), {
  lifecycle: { total: 4, draft: 1, active: 2, inactive: 1 },
  health: { online: 1, warning: 0, degraded: 1, offline: 0, unknown: 2 },
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

assert.deepEqual(
  validateChannelDraft({ name: "", category: "in_store", channel_type_id: "", device_ids: [] }),
  { name: "กรุณาระบุชื่อ Channel", channel_type_id: "กรุณาเลือก Channel Type" },
);

assert.equal(formatChannelLastSeen(null), "Never connected");
assert.equal(formatChannelLastSeen("2026-08-20T00:00:00.000Z", Date.parse("2026-08-20T00:01:00.000Z")), "Last seen 1m ago");

console.log("channel-logic.check.mts — all assertions passed");
