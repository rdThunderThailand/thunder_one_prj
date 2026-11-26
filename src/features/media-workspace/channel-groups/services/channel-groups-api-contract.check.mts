/** Run: node src/features/media-workspace/channel-groups/services/channel-groups-api-contract.check.mts */
import assert from "node:assert/strict";
import { parseChannelGroup, parseChannelGroupList } from "./channel-groups-api.ts";

const group = {
  id: "g1",
  name: "All Restaurant Screens",
  description: "All screens in restaurant locations",
  status: "active",
  playback_mode: "synchronized",
  members: [{ id: "c1", name: "Main Dining 01" }],
  member_count: 1,
  created_at: "2026-01-05T11:20:00Z",
  updated_at: "2026-05-12T10:32:00Z",
};

assert.deepEqual(parseChannelGroup(group), group);
assert.throws(() => parseChannelGroup({ ...group, status: "bogus" }));
assert.throws(() => parseChannelGroup({ ...group, members: "not-array" }));

assert.equal(parseChannelGroupList({ success: true, data: [group] }).length, 1);
assert.equal(parseChannelGroupList([]).length, 0);
assert.throws(() => parseChannelGroupList({ not: "an array" }));

console.log("channel-groups-api-contract.check.mts — all assertions passed");
