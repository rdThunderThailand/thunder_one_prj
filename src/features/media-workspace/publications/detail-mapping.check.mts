import assert from "node:assert/strict";
import { detailToDraft } from "./detail-mapping.ts";
import { targetsFromSelection } from "./draft-mapping.ts";
import type { ChannelListItem } from "../channels/types/index.ts";
import type { PublicationDetail } from "./types/index.ts";

const compositionPublication = {
  id: "publication-1",
  name: "Composition draft",
  publication_type: "composition",
  priority: "normal",
  status: "draft",
  tags: [],
  composition: { id: "composition-1", name: "Menu Board", status: "active" },
} satisfies PublicationDetail;

const draft = detailToDraft(compositionPublication);
assert.equal(draft.compositionId, "composition-1");
assert.equal(draft.playlistId, null);

const playlistPublication = {
  ...compositionPublication,
  publication_type: "playlist",
  composition: null,
  playlist: { id: "playlist-1", name: "Existing playlist" },
} satisfies PublicationDetail;

assert.equal(detailToDraft(playlistPublication).compositionId, null);
assert.equal(detailToDraft(playlistPublication).playlistId, "playlist-1");

const channel = {
  id: "channel-1",
  name: "Lobby",
  description: null,
  lifecycle: "active",
  category: "dooh",
  channel_type: null,
  location: null,
  player: null,
  health: null,
  output_kind: "screen",
  display_config: null,
  groups: [{ id: "group-1", name: "All Restaurant Screens", playback_mode: "independent" }],
  expected_orientation: null,
  expected_resolution: null,
  default_playlist: null,
  revision: 1,
  updated_at: "2026-09-14T00:00:00Z",
} satisfies ChannelListItem;

const publicationWithEveryTarget = {
  ...compositionPublication,
  publication_targets: [
    { target_type: "channel", channel_id: "channel-1", name: "Lobby" },
    { target_type: "group", group_id: "group-1", name: "All Restaurant Screens" },
    { target_type: "device", device_id: "device-1", name: "Legacy screen" },
  ],
} satisfies PublicationDetail;

const resumed = detailToDraft(publicationWithEveryTarget);
assert.deepEqual(resumed.channelIds, ["channel-1"]);
assert.deepEqual(resumed.groupIds, ["group-1"]);
assert.deepEqual(resumed.groupNamesById, { "group-1": "All Restaurant Screens" });
assert.deepEqual(targetsFromSelection(resumed.channelIds, resumed.groupIds, resumed.groupNamesById, [channel]), [
  { target_type: "channel", channel_id: "channel-1", name: "Lobby" },
  { target_type: "group", group_id: "group-1", name: "All Restaurant Screens" },
]);

// A resumed draft keeps a custom-dates schedule (it used to come back as `recurring` with no days).
const datesPublication = {
  ...compositionPublication,
  schedule: {
    starts_at: "2026-11-02T17:00:00.000Z",
    ends_at: "2026-11-10T17:00:00.000Z",
    timezone: "Asia/Bangkok",
    recurrence: { freq: "dates", dates: ["2026-11-03", "2026-11-10"], daily_start: "00:00", daily_end: "23:59" },
  },
} satisfies PublicationDetail;
const resumedDates = detailToDraft(datesPublication, null, "2026-10-01").schedule;
assert.equal(resumedDates.mode, "dates");
assert.deepEqual(resumedDates.dates, ["2026-11-03", "2026-11-10"]);

console.log("detail-mapping.check.mts — all assertions passed");
