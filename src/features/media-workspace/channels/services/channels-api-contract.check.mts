/**
 * Runnable Channel request-contract check:
 *
 *     node src/features/channels/services/channels-api-contract.check.mts
 */
import assert from "node:assert/strict";
import {
  buildChannelDeviceCandidatesRequest,
  buildChannelReferenceDataRequest,
  buildCreateChannelRequest,
  buildChannelListPath,
  buildCreateChannelBody,
  buildDeactivateChannelRequest,
  buildDeleteDraftChannelRequest,
  buildFetchChannelRequest,
  buildFetchChannelsRequest,
  buildUpdateChannelRequest,
  buildUpdateChannelBody,
  parseChannelDetail,
  parseChannelDeviceCandidates,
  parseChannelList,
  parseChannelReferenceData,
} from "./channels-api.ts";
import type { ChannelDraftInput } from "../types/index.ts";

const draft: ChannelDraftInput = {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
  confirm_mismatch: true,
  as_draft: null,
  sync_enabled: false,
};

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

// The backend accepts channel_category, not the UI's category field. `as_draft` is the ADR 0037
// button: a create must pick a side, and the update-only `null` falls back to the safe one.
assert.deepEqual(buildCreateChannelBody(draft), {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  channel_category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
  confirm_mismatch: true,
  as_draft: true,
  sync_enabled: false,
});
assert.equal(buildCreateChannelBody({ ...draft, as_draft: false }).as_draft, false);
assert.equal(buildCreateChannelBody({ ...draft, sync_enabled: true }).sync_enabled, true);
assert.deepEqual(buildCreateChannelRequest(draft), {
  method: "POST",
  path: "/media/channels",
  body: {
    name: "Central World Menu Boards",
    description: "Menu boards for in-store promotions",
    channel_category: "in_store",
    channel_type_id: "type-menu-board",
    location_id: "location-central-world",
    device_ids: ["screen-1", "screen-2"],
    expected_orientation: "landscape",
    expected_resolution: "1920x1080",
    default_playlist_id: "playlist-kfc-wednesday",
    confirm_mismatch: true,
    as_draft: true,
    sync_enabled: false,
  },
});

// An update must retain every normalized field and the optimistic-lock revision. It carries
// `as_draft` only when a Draft is being committed — an ordinary edit must not restage anything.
assert.deepEqual(buildUpdateChannelBody(draft, 7, false), {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  channel_category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
  confirm_mismatch: true,
  sync_enabled: false,
  expected_revision: 7,
  overwrite: false,
});
assert.ok(!("as_draft" in buildUpdateChannelBody(draft, 7, false)));
assert.equal(buildUpdateChannelBody({ ...draft, as_draft: false }, 7, false).as_draft, false);
assert.equal(buildUpdateChannelBody({ ...draft, as_draft: true }, 7, false).as_draft, true);
assert.deepEqual(buildUpdateChannelRequest("channel-1", draft, 7, false), {
  method: "PATCH",
  path: "/media/channels/channel-1",
  body: {
    name: "Central World Menu Boards",
    description: "Menu boards for in-store promotions",
    channel_category: "in_store",
    channel_type_id: "type-menu-board",
    location_id: "location-central-world",
    device_ids: ["screen-1", "screen-2"],
    expected_orientation: "landscape",
    expected_resolution: "1920x1080",
    default_playlist_id: "playlist-kfc-wednesday",
    confirm_mismatch: true,
    sync_enabled: false,
    expected_revision: 7,
    overwrite: false,
  },
});
assert.equal(buildUpdateChannelBody(draft, 8, true).overwrite, true);
assert.equal(buildUpdateChannelRequest("channel-1", draft, 8, true).body &&
  (buildUpdateChannelRequest("channel-1", draft, 8, true).body as { overwrite: boolean }).overwrite, true);

// Optional editor fields normalize to null, so updates can deliberately clear them.
assert.deepEqual(
  buildUpdateChannelBody(
    {
      name: "Draft kiosk",
      category: "dooh",
      channel_type_id: "type-kiosk",
      device_ids: [],
      confirm_mismatch: false,
      as_draft: null,
      sync_enabled: true,
    },
    3,
    false,
  ),
  {
    name: "Draft kiosk",
    description: null,
    channel_category: "dooh",
    channel_type_id: "type-kiosk",
    location_id: null,
    device_ids: [],
    expected_orientation: null,
    expected_resolution: null,
    default_playlist_id: null,
    confirm_mismatch: false,
    sync_enabled: true,
    expected_revision: 3,
    overwrite: false,
  },
);

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
assert.deepEqual(buildChannelDeviceCandidatesRequest(), {
  method: "GET",
  path: "/media/screens",
});

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
assert.deepEqual(parseChannelDetail({ data: channel }), channel);
assert.deepEqual(parseChannelDeviceCandidates({
  screens: [{
    id: "screen-1",
    name: "Entrance Screen",
    status_level: "online",
    last_heartbeat_at: "2026-08-20T00:00:00.000Z",
    orientation: "landscape",
    resolution: "1920x1080",
  }],
}), [{
  id: "screen-1",
  name: "Entrance Screen",
  code: null,
  health: "online",
  last_heartbeat_at: "2026-08-20T00:00:00.000Z",
  orientation: "landscape",
  resolution: "1920x1080",
}]);
assert.deepEqual(parseChannelDeviceCandidates({ screens: [{ id: "screen-2", name: "Unknown Screen" }] }), [{
  id: "screen-2",
  name: "Unknown Screen",
  code: null,
  health: "offline",
  last_heartbeat_at: null,
  orientation: null,
  resolution: null,
}]);

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
assert.throws(() => parseChannelDeviceCandidates([{ id: "screen-1", name: "Bad status", status_level: "unknown" }]));
assert.throws(() => parseChannelDeviceCandidates([{ id: "screen-1", name: "Bad orientation", orientation: "square" }]));
assert.throws(() => parseChannelDeviceCandidates([{ id: "screen-1", name: "Bad resolution", resolution: "full-hd" }]));
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
assert.throws(() => buildUpdateChannelBody(draft, 1.5, false));
assert.throws(() => buildUpdateChannelBody(draft, Number.NaN, false));
assert.throws(() => buildUpdateChannelBody(draft, Number.MAX_SAFE_INTEGER + 1, false));
assert.throws(() => buildDeleteDraftChannelRequest("channel-1", 0));
assert.throws(() => buildDeactivateChannelRequest("channel-1", -1));

console.log("channels-api-contract.check.mts — all assertions passed");
