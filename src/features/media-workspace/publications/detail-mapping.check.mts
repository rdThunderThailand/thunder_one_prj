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

const playlistPublication = {
  ...compositionPublication,
  publication_type: "playlist",
  composition: null,
} satisfies PublicationDetail;

assert.equal(detailToDraft(playlistPublication).compositionId, null);

const channel = {
  id: "channel-1",
  name: "Lobby",
  description: null,
  lifecycle: "active",
  category: "dooh",
  channel_type: null,
  location: null,
  devices: [],
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
  sync_enabled: false,
  direct_target_conflicts: [],
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

console.log("detail-mapping.check.mts — all assertions passed");
