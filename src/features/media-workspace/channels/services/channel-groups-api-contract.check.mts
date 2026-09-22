/** Run: node src/features/media-workspace/channels/services/channel-groups-api-contract.check.mts */
import assert from "node:assert/strict";
import { parseChannelGroupsCount } from "./channel-groups-api.ts";

assert.equal(parseChannelGroupsCount([]), 0);
assert.equal(parseChannelGroupsCount([{ id: "g1" }, { id: "g2" }]), 2);
assert.equal(parseChannelGroupsCount({ data: [{ id: "g1" }] }), 1);
assert.throws(() => parseChannelGroupsCount({ not: "an array" }));
assert.throws(() => parseChannelGroupsCount(null));

console.log("channel-groups-api-contract.check.mts — all assertions passed");
