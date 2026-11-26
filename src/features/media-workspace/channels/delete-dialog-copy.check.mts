/** Run: node src/features/media-workspace/channels/delete-dialog-copy.check.mts */
import assert from "node:assert/strict";
import { deleteDialogLines, deleteSuccessMessage } from "./delete-dialog-copy.ts";

const noHistory = { draft_programs: [], has_history: false };
const history = { draft_programs: [{ id: "p1", name: "Spring" }, { id: "p2", name: "Summer" }], has_history: true };

// No history (or detail not known): the phase-1 text.
assert.deepEqual(deleteDialogLines(noHistory, "Player 1"), ["Player 1 becomes available for another Channel."]);
assert.deepEqual(deleteDialogLines(null, "Player 1"), ["Player 1 becomes available for another Channel."]);
assert.deepEqual(deleteDialogLines(noHistory, null), []);

// History: Drafts listed, then the history line; no Drafts means no Draft line.
assert.deepEqual(deleteDialogLines(history, null), [
  "These Draft Programs lose this Channel: Spring, Summer.",
  "Past Programs and Playback Proof keep its name, marked deleted.",
]);
assert.deepEqual(deleteDialogLines({ draft_programs: [], has_history: true }, "Player 1"), [
  "Player 1 becomes available for another Channel.",
  "Past Programs and Playback Proof keep its name, marked deleted.",
]);

// Toast: follows the returned mode; missing or "removed" is the phase-1 toast.
assert.equal(deleteSuccessMessage(undefined, "Player 1"), "Channel deleted — Player 1 is free");
assert.equal(deleteSuccessMessage("removed", null), "Channel deleted");
assert.equal(deleteSuccessMessage("tombstoned", "Player 1"), "Channel deleted — Player 1 is free. Its history is kept.");

console.log("delete-dialog-copy.check.mts — all assertions passed");
