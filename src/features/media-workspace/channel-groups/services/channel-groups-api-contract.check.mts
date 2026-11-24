/** Run: node src/features/media-workspace/channel-groups/services/channel-groups-api-contract.check.mts */
import assert from "node:assert/strict";
import { isGroupInUse, isSyncConflict, parseChannelGroup, parseChannelGroupList } from "./channel-groups-api.ts";

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

assert.equal(isSyncConflict('Invalid input: cannot add to synchronized group "X", already synchronized elsewhere: Y'), true);
assert.equal(isSyncConflict("Invalid input: a channel in this selection is already in another synchronized group"), true);
assert.equal(isSyncConflict("Invalid input: channel group name is required"), false);

assert.equal(isGroupInUse("Already in use: remove this group from these publications first: Promo A"), true);
assert.equal(isGroupInUse("Already exists: a channel group named X already exists"), false);

console.log("channel-groups-api-contract.check.mts — all assertions passed");
