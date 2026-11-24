/** Run: node src/features/media-workspace/channels/services/player-candidates-api-contract.check.mts */
import assert from "node:assert/strict";
import { parseChannelPlayerCandidates } from "./player-candidates-api.ts";

const raw = {
  id: "d995d6e8-d16e-4ad3-8736-3a95f1037250",
  name: "Player 01",
  code: "PLY-001",
  model: "Windows Mini PC",
  location: { id: "loc-1", name: "Main Restaurant" },
  registry_status: "registered",
  never_connected: false,
  health: "online",
  last_heartbeat_at: "2026-09-14T00:00:00Z",
  orientation: "landscape",
  resolution: "1920x1080",
  reserved_by_channel: null,
};

const [parsed] = parseChannelPlayerCandidates([raw]);
assert.equal(parsed!.id, raw.id);
assert.equal(parsed!.location?.name, "Main Restaurant");
assert.equal(parsed!.reservedByChannel, null);

const reserved = parseChannelPlayerCandidates([
  { ...raw, id: "p-2", model: null, location: null, reserved_by_channel: { id: "ch-1", name: "Channel for Screen 1" } },
]);
assert.equal(reserved[0]!.model, null);
assert.equal(reserved[0]!.location, null);
assert.deepEqual(reserved[0]!.reservedByChannel, { id: "ch-1", name: "Channel for Screen 1" });

// The `{ data: [...] }` envelope shape, same as every other channels-service read.
assert.equal(parseChannelPlayerCandidates({ data: [raw] }).length, 1);

assert.throws(() => parseChannelPlayerCandidates({ not: "an array" }));
assert.throws(() => parseChannelPlayerCandidates([{ ...raw, health: "degraded" }]));
assert.throws(() => parseChannelPlayerCandidates([{ ...raw, never_connected: "yes" }]));

console.log("player-candidates-api-contract.check.mts — all assertions passed");
