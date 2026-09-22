/** Run: node src/features/media-workspace/channels/player-candidates.check.mts */
import assert from "node:assert/strict";
import {
  filterPlayerCandidates,
  isPlayerAvailable,
  partitionPlayerCandidates,
  unavailableReason,
  type ChannelPlayerCandidate,
} from "./player-candidates.ts";

function candidate(overrides: Partial<ChannelPlayerCandidate>): ChannelPlayerCandidate {
  return {
    id: "p-1",
    name: "Player 01",
    code: "PLY-001",
    model: "Windows Mini PC",
    location: { id: "loc-1", name: "Main Restaurant" },
    registryStatus: "registered",
    neverConnected: false,
    health: "online",
    lastHeartbeatAt: "2026-09-14T00:00:00Z",
    orientation: "landscape",
    resolution: "1920x1080",
    reservedByChannel: null,
    ...overrides,
  };
}

const available = candidate({});
const neverConnected = candidate({ id: "p-2", name: "Player 02", neverConnected: true, registryStatus: "pending" });
const reserved = candidate({ id: "p-3", name: "Player 03", reservedByChannel: { id: "ch-1", name: "Channel for Screen 1" } });

assert.equal(isPlayerAvailable(available), true);
assert.equal(isPlayerAvailable(neverConnected), true);
assert.equal(isPlayerAvailable(reserved), false);

assert.equal(unavailableReason(available), null);
assert.equal(unavailableReason(neverConnected), null);
assert.equal(unavailableReason(reserved), "In use by Channel for Screen 1");

const partitioned = partitionPlayerCandidates([available, neverConnected, reserved]);
assert.deepEqual(partitioned.available.map((c) => c.id), ["p-1", "p-2"]);
assert.deepEqual(partitioned.unavailable.map((c) => c.id), ["p-3"]);

assert.deepEqual(filterPlayerCandidates([available, neverConnected], "").map((c) => c.id), ["p-1", "p-2"]);
assert.deepEqual(filterPlayerCandidates([available, neverConnected], "02").map((c) => c.id), ["p-2"]);
assert.deepEqual(filterPlayerCandidates([available], "main restaurant").map((c) => c.id), ["p-1"]);
assert.deepEqual(filterPlayerCandidates([available], "nope").map((c) => c.id), []);

// excludeChannelId (the edit page's own Channel): its own reservation reads as available, a
// different Channel's reservation still does not.
assert.equal(isPlayerAvailable(reserved, "ch-1"), true);
assert.equal(isPlayerAvailable(reserved, "ch-2"), false);
assert.equal(unavailableReason(reserved, "ch-1"), null);
assert.equal(unavailableReason(reserved, "ch-2"), "In use by Channel for Screen 1");
assert.deepEqual(
  partitionPlayerCandidates([available, neverConnected, reserved], "ch-1").available.map((c) => c.id),
  ["p-1", "p-2", "p-3"],
);

console.log("player-candidates.check.mts — all assertions passed");
