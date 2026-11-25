/** Run: node src/features/media-workspace/media-status.check.mts */
import assert from "node:assert/strict";
import { MEDIA_STATUS, mediaStatus } from "./media-status.ts";

// ADR 0125 decision 5: tone per state.
const tones = {
  green: ["active", "live", "online", "ready"],
  blue: ["scheduled"],
  indigo: ["publishing", "processing"],
  yellow: ["warning"],
  red: ["failed", "offline"],
  zinc: ["draft", "inactive", "ended", "archived", "expired", "no_player"],
};
let count = 0;
for (const [color, states] of Object.entries(tones)) {
  for (const state of states) {
    assert.equal(mediaStatus(state).color, color, state);
    count += 1;
  }
}
assert.equal(count, Object.keys(MEDIA_STATUS).length, "every state is covered by the tone table");

assert.equal(mediaStatus("ready").label, "Ready");
assert.equal(mediaStatus("no_player").label, "No player");
assert.equal(mediaStatus("draft").label, "Draft");

// Unknown backend values degrade to neutral with the raw value; inherited keys are not states.
assert.deepEqual(mediaStatus("cancelled"), { label: "cancelled", color: "zinc" });
assert.deepEqual(mediaStatus("constructor"), { label: "constructor", color: "zinc" });
assert.deepEqual(mediaStatus(""), { label: "", color: "zinc" });

console.log("media-status.check.mts — all assertions passed");
