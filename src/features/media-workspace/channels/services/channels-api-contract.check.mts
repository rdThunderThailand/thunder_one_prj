/**
 * Runnable Channel request-contract check:
 *
 *     node src/features/channels/services/channels-api-contract.check.mts
 */
import assert from "node:assert/strict";
import {
  buildChannelListPath,
  buildChannelReferenceDataRequest,
  buildDeactivateChannelRequest,
  buildDeleteDraftChannelRequest,
  buildFetchChannelRequest,
  buildFetchChannelsRequest,
  parseChannelDetail,
  parseChannelList,
  parseChannelReferenceData,
} from "./channels-api.ts";

// A wrong query key or order would make filtering silently diverge from the future API contract.
assert.deepEqual(
  buildChannelListPath({ category: "in_store", lifecycle: "active" }),
  "/media/channels?category=in_store&lifecycle=active",
);
assert.deepEqual(buildFetchChannelsRequest({ category: "in_store", lifecycle: "active" }), {
  method: "GET",
  path: "/media/channels?category=in_store&lifecycle=active",
});
assert.deepEqual(buildFetchChannelRequest("channel-1"), {
  method: "GET",
  path: "/media/channels/channel-1",
});
assert.deepEqual(buildChannelReferenceDataRequest(), {
  method: "GET",
  path: "/media/channels/reference-data",
});

// Every non-create mutation carries the revision token through its method/path/body descriptor.
assert.deepEqual(buildDeleteDraftChannelRequest("channel-1", 4), {
  method: "DELETE",
  path: "/media/channels/channel-1",
  body: { expected_revision: 4 },
});
assert.deepEqual(buildDeactivateChannelRequest("channel-1", 6), {
  method: "POST",
  path: "/media/channels/channel-1/deactivate",
  body: { expected_revision: 6 },
});
assert.throws(() => buildDeleteDraftChannelRequest("channel-1", 0));
assert.throws(() => buildDeactivateChannelRequest("channel-1", -1));

const channel = {
  id: "channel-1",
  name: "Central World Menu Boards",
  description: null,
  lifecycle: "draft",
  category: "in_store",
  channel_type: {
    id: "type-menu-board",
    code: "menu_board",
    name: "Menu Board",
    channel_category: "in_store",
  },
  location: { id: "location-central-world", name: "Central World" },
  devices: [
    {
      id: "screen-1",
      name: "Entrance Screen",
      code: "CW-ENT-01",
      health: "online",
      last_heartbeat_at: "2026-08-20T00:00:00.000Z",
      orientation: "landscape",
      resolution: "1920x1080",
      sync_phase_error_ms: null,
      sync_loop_duration_seconds: null,
    },
  ],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist: { id: "playlist-1", name: "Lunch Menu" },
  revision: 7,
  updated_at: "2026-08-20T00:00:00.000Z",
  created_at: "2026-08-19T00:00:00.000Z",
  sync_enabled: false,
  direct_target_conflicts: [],
};

const parsedList = parseChannelList({ channels: [channel] });
assert.equal(parsedList.length, 1);
assert.equal(parsedList[0]?.id, "channel-1");
assert.equal(parsedList[0]?.revision, 7);
assert.equal("created_at" in parsedList[0]!, false);
// A legacy (pre-ticket-02) payload has no `output_kind` / `health` / `player` / `display_config`
// at all — the parser must still produce a usable row, not throw.
assert.equal(parsedList[0]?.output_kind, "screen");
assert.equal(parsedList[0]?.health, null);
assert.deepEqual(parsedList[0]?.player, channel.devices[0]);
assert.equal(parsedList[0]?.display_config, null);
assert.deepEqual(parseChannelDetail({ data: channel }), {
  ...channel,
  player: channel.devices[0],
  health: null,
  output_kind: "screen",
  display_config: null,
});

// Core v2 payload: `player`/`health`/`output_kind`/`display_config` present, single-screen.
const v2SingleChannel = {
  ...channel,
  id: "channel-v2-single",
  output_kind: "kiosk",
  health: "warning",
  player: channel.devices[0],
  display_config: null,
};
const v2Single = parseChannelDetail({ data: v2SingleChannel });
assert.equal(v2Single.output_kind, "kiosk");
assert.equal(v2Single.health, "warning");
assert.deepEqual(v2Single.player, channel.devices[0]);
assert.equal(v2Single.display_config, null);

// Core v2 payload: multi-screen Channel, Player-less Draft (`player`/`health` both null).
const v2MultiDraft = {
  ...channel,
  id: "channel-v2-multi",
  devices: [],
  output_kind: "screen",
  health: null,
  player: null,
  display_config: {
    mode: "multi",
    arrangement: { rows: 1, cols: 2 },
    screens: [
      { index: 0, resolution: "1920x1080", output: "HDMI 1" },
      { index: 1, resolution: "1920x1080", output: "HDMI 2" },
    ],
  },
};
const v2Multi = parseChannelDetail({ data: v2MultiDraft });
assert.equal(v2Multi.player, null);
assert.equal(v2Multi.health, null);
assert.deepEqual(v2Multi.display_config, v2MultiDraft.display_config);
assert.equal(v2Multi.display_config?.screens.length, 2);

// A `health` outside online/warning/offline (e.g. the pre-M1b transitional `degraded`) is a parse
// error, not a silently-rendered status — ADR 0074 §4, ticket 07: Degraded is nowhere in the types.
assert.throws(() => parseChannelDetail({ data: { ...channel, health: "degraded" } }));
assert.throws(() => parseChannelDetail({ data: { ...channel, output_kind: "audio" } }));
assert.throws(() => parseChannelDetail({
  data: { ...channel, display_config: { mode: "wide", arrangement: { rows: 1, cols: 1 }, screens: [] } },
}));
assert.throws(() => parseChannelDetail({
  data: { ...channel, display_config: { mode: "multi", arrangement: "1x1", screens: [] } },
}));

// A 2xx malformed response must stay in the UI error path, not become empty/success state.
assert.throws(() => parseChannelList([{}]));
assert.throws(() => parseChannelDetail({}));
assert.throws(() => parseChannelDetail({ ...channel, revision: 7.5 }));
assert.throws(() => parseChannelDetail({ ...channel, revision: 0 }));
assert.throws(() => parseChannelDetail({ ...channel, revision: -1 }));
assert.throws(() => parseChannelDetail({
  ...channel,
  category: "dooh",
}));
// ADR 0037 moved the Active/Inactive decision into channel_rows, so the parser reads `lifecycle`
// and asks no questions. An extra `publication_count` from the RPC is ignored, not rejected — which
// is also what lets this parser keep working against a backend that has not taken 103 yet.
assert.equal(parseChannelDetail({ ...channel, lifecycle: "active" }).lifecycle, "active");
assert.equal("publication_count" in parseChannelDetail({ ...channel, publication_count: 3 }), false);
assert.throws(() => parseChannelDetail({ ...channel, lifecycle: "retired" }));
assert.throws(() => parseChannelDetail({
  ...channel,
  expected_resolution: "full-hd",
}));
assert.throws(() => parseChannelDetail({
  ...channel,
  expected_resolution: "1600x900",
}));
assert.throws(() => parseChannelDetail({
  ...channel,
  devices: [{ ...channel.devices[0], resolution: "full-hd" }],
}));
assert.equal(
  parseChannelDetail({
    ...channel,
    devices: [{ ...channel.devices[0], resolution: "1600x900" }],
  }).devices[0]?.resolution,
  "1600x900",
);
assert.throws(() => parseChannelDetail({ ...channel, sync_enabled: "yes" }));
assert.throws(() => parseChannelDetail({ ...channel, direct_target_conflicts: "not-an-array" }));
assert.deepEqual(
  parseChannelDetail({ ...channel, sync_enabled: true, direct_target_conflicts: ["BOEtest"] })
    .direct_target_conflicts,
  ["BOEtest"],
);
assert.throws(() => parseChannelReferenceData({ channel_types: [], locations: "bad" }));
assert.throws(() => parseChannelReferenceData({
  channel_types: [{ id: "type-1", code: "broken", name: "Broken", channel_category: "other" }],
  locations: [],
}));
assert.deepEqual(
  parseChannelReferenceData({
    channel_types: [
      {
        id: "type-retired",
        code: "retired",
        name: "Retired Menu Board",
        channel_category: "in_store",
        is_active: false,
      },
    ],
    locations: [],
  }).channel_types[0],
  {
    id: "type-retired",
    code: "retired",
    name: "Retired Menu Board",
    channel_category: "in_store",
    is_active: false,
  },
);
assert.throws(() => parseChannelReferenceData({
  channel_types: [{
    id: "type-1",
    code: "bad-active",
    name: "Bad Active",
    channel_category: "dooh",
    is_active: "yes",
  }],
  locations: [],
}));

console.log("channels-api-contract.check.mts — all assertions passed");
