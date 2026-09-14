/** Run: node src/features/media-workspace/channels/display-structure.check.mts */
import assert from "node:assert/strict";
import { structureNodes } from "./display-structure.ts";
import type { ChannelDevice } from "./types/index.ts";

const player: ChannelDevice = {
  id: "device-1",
  name: "Player 01",
  code: "PLY-001",
  health: "online",
  last_heartbeat_at: null,
  orientation: "landscape",
  resolution: "1920x1080",
  sync_phase_error_ms: null,
  sync_loop_duration_seconds: null,
};

// Single-screen: no display_config, canvas resolution wins over the Player's own reading.
const single = structureNodes({
  player,
  health: "online",
  display_config: null,
  expected_resolution: "1920x1080",
});
assert.deepEqual(single.player, { name: "Player 01", code: "PLY-001", health: "online" });
assert.equal(single.screens.length, 1);
assert.deepEqual(single.screens[0], { key: "1", label: "Screen", resolution: "1920x1080", output: null });

// No canvas set: falls back to the Player's reported resolution.
const noCanvas = structureNodes({ player, health: "online", display_config: null, expected_resolution: null });
assert.equal(noCanvas.screens[0]!.resolution, "1920x1080");

// Player-less Draft: no player node, still renders the synthetic screen.
const noPlayer = structureNodes({ player: null, health: null, display_config: null, expected_resolution: null });
assert.equal(noPlayer.player, null);
assert.equal(noPlayer.screens[0]!.resolution, "Not set");

// Multi-screen: one node per `display_config.screens`.
const multi = structureNodes({
  player,
  health: "warning",
  display_config: {
    mode: "multi",
    arrangement: "3x1",
    screens: [
      { index: 1, resolution: "1920x1080", output: "HDMI 1" },
      { index: 2, resolution: "1920x1080", output: "HDMI 2" },
      { index: 3, resolution: "1920x1080", output: "HDMI 3" },
    ],
  },
  expected_resolution: "5760x1080",
});
assert.equal(multi.player!.health, "warning");
assert.equal(multi.screens.length, 3);
assert.deepEqual(multi.screens[1], { key: "2", label: "Screen 02", resolution: "1920x1080", output: "HDMI 2" });

console.log("display-structure.check.mts — all assertions passed");
