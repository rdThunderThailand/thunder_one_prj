/** Run: node src/features/media-workspace/channel-groups/channel-groups-logic.check.mts */
import assert from "node:assert/strict";
import { channelsById, channelsInGroupsCount, memberHealthCounts, summarizeGroups, ungroupedChannels } from "./channel-groups-logic.ts";

const groups = [
  { id: "g1", status: "active" } as never,
  { id: "g2", status: "disabled" } as never,
  { id: "g3", status: "active" } as never,
];
assert.deepEqual(summarizeGroups(groups), { total: 3, active: 2, disabled: 1 });

const channels = [
  { id: "c1", groups: [{ id: "g1", name: "G1", playback_mode: "synchronized" }] } as never,
  { id: "c2", groups: [] } as never,
  { id: "c3" } as never,
];
assert.deepEqual(
  ungroupedChannels(channels).map((c) => c.id),
  ["c2", "c3"]
);
assert.equal(channelsInGroupsCount(channels), 1);

const group = { members: [{ id: "c1" }, { id: "c2" }, { id: "c3" }] } as never;
const byId = channelsById([
  { id: "c1", health: "online" } as never,
  { id: "c2", health: "warning" } as never,
  { id: "c3", health: "offline" } as never,
]);
assert.deepEqual(memberHealthCounts(group, byId), { online: 1, offline: 1, warning: 1 });

console.log("channel-groups-logic.check.mts — all assertions passed");
