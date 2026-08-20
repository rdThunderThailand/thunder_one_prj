/**
 * Runnable Channel request-contract check:
 *
 *     node src/features/channels/services/channels-api-contract.check.mts
 */
import assert from "node:assert/strict";
import {
  buildActivateChannelRequest,
  buildChannelDeviceCandidatesRequest,
  buildChannelListPath,
  buildCreateChannelBody,
  buildDeactivateChannelRequest,
  buildDeleteDraftChannelRequest,
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
};

// A wrong query key or order would make filtering silently diverge from the future API contract.
assert.deepEqual(
  buildChannelListPath({ category: "in_store", lifecycle: "active" }),
  "/media/channels?category=in_store&lifecycle=active",
);

// The backend accepts channel_category (not the UI's category field) and creates drafts itself.
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
});

// An update must retain every normalized field and the optimistic-lock revision.
assert.deepEqual(buildUpdateChannelBody(draft, 7), {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  channel_category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
  expected_revision: 7,
});

// Optional editor fields normalize to null, so updates can deliberately clear them.
assert.deepEqual(
  buildUpdateChannelBody(
    { name: "Draft kiosk", category: "dooh", channel_type_id: "type-kiosk", device_ids: [] },
    3,
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
    expected_revision: 3,
  },
);

// Every non-create mutation carries the revision token through its method/path/body descriptor.
assert.deepEqual(buildDeleteDraftChannelRequest("channel-1", 4), {
  method: "DELETE",
  path: "/media/channels/channel-1",
  body: { expected_revision: 4 },
});
assert.deepEqual(buildActivateChannelRequest("channel-1", 5), {
  method: "POST",
  path: "/media/channels/channel-1/activate",
  body: { expected_revision: 5 },
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
  health: null,
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
    },
  ],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist: { id: "playlist-1", name: "Lunch Menu" },
  revision: 7,
  updated_at: "2026-08-20T00:00:00.000Z",
  created_at: "2026-08-19T00:00:00.000Z",
};

const parsedList = parseChannelList({ channels: [channel] });
assert.equal(parsedList.length, 1);
assert.equal(parsedList[0]?.id, "channel-1");
assert.equal(parsedList[0]?.revision, 7);
assert.equal("created_at" in parsedList[0]!, false);
assert.deepEqual(parseChannelDetail({ data: channel }), channel);
assert.deepEqual(parseChannelDeviceCandidates({ screens: channel.devices }), channel.devices);

// A 2xx malformed response must stay in the UI error path, not become empty/success state.
assert.throws(() => parseChannelList([{}]));
assert.throws(() => parseChannelDetail({}));
assert.throws(() => parseChannelDetail({ ...channel, revision: 7.5 }));
assert.throws(() => parseChannelReferenceData({ channel_types: [], locations: "bad" }));
assert.throws(() => parseChannelReferenceData({
  channel_types: [{ id: "type-1", code: "broken", name: "Broken", channel_category: "other" }],
  locations: [],
}));
assert.throws(() => parseChannelDeviceCandidates([{ id: "screen-1", name: "Missing fields" }]));
assert.throws(() => buildUpdateChannelBody(draft, 1.5));
assert.throws(() => buildActivateChannelRequest("channel-1", 1.5));

console.log("channels-api-contract.check.mts — all assertions passed");
