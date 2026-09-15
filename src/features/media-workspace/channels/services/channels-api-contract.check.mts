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

const player = {
  id: "screen-1",
  name: "Entrance Screen",
  code: "CW-ENT-01",
  health: "online",
  last_heartbeat_at: "2026-08-20T00:00:00.000Z",
  orientation: "landscape",
  resolution: "1920x1080",
  sync_phase_error_ms: null,
  sync_loop_duration_seconds: null,
};

// The post-M2 channel_rows shape (ticket 13): one `player`, no devices[] / sync_enabled /
// direct_target_conflicts. An extra `publication_count` from the RPC is ignored, not rejected.
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
  player,
  health: "online",
  output_kind: "kiosk",
  display_config: null,
  groups: [{ id: "group-1", name: "Central World", playback_mode: "synchronized" }],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist: { id: "playlist-1", name: "Lunch Menu" },
  revision: 7,
  updated_at: "2026-08-20T00:00:00.000Z",
  created_at: "2026-08-19T00:00:00.000Z",
  publication_count: 3,
};

const parsedList = parseChannelList({ channels: [channel] });
assert.equal(parsedList.length, 1);
assert.equal(parsedList[0]?.id, "channel-1");
assert.equal(parsedList[0]?.revision, 7);
assert.equal("created_at" in parsedList[0]!, false);
assert.equal("publication_count" in parsedList[0]!, false);
assert.deepEqual(parsedList[0]?.player, player);
assert.deepEqual(parsedList[0]?.groups, channel.groups);
const expectedDetail = { ...channel, publication_count: undefined };
delete expectedDetail.publication_count;
assert.deepEqual(parseChannelDetail({ data: channel }), expectedDetail);

// Multi-screen Channel, Player-less Draft (`player`/`health` both null).
const multiDraft = {
  ...channel,
  id: "channel-multi",
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
const multi = parseChannelDetail({ data: multiDraft });
assert.equal(multi.player, null);
assert.equal(multi.health, null);
assert.deepEqual(multi.display_config, multiDraft.display_config);
assert.equal(multi.display_config?.screens.length, 2);

// The compatibility read is gone: a payload without the Core v2 fields is malformed, never a
// silently-defaulted row.
assert.throws(() => parseChannelDetail({ data: { ...channel, player: undefined } }));
assert.throws(() => parseChannelDetail({ data: { ...channel, health: undefined } }));
assert.throws(() => parseChannelDetail({ data: { ...channel, output_kind: undefined } }));
assert.throws(() => parseChannelDetail({ data: { ...channel, groups: undefined } }));

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
assert.equal(parseChannelDetail({ ...channel, lifecycle: "active" }).lifecycle, "active");
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
  player: { ...player, resolution: "full-hd" },
}));
assert.equal(
  parseChannelDetail({
    ...channel,
    player: { ...player, resolution: "1600x900" },
  }).player?.resolution,
  "1600x900",
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
