import assert from "node:assert/strict";
import { defaultPlayback, emptyEditorState, moveItem } from "./playlist-editor-state.ts";

const items = ["a", "b", "c", "d"].map((id) => ({ mediaAssetId: id, durationSeconds: null, transition: "cut" as const }));

// move down, move up, no-op cases.
assert.deepEqual(moveItem(items, 0, 2).map((i) => i.mediaAssetId), ["b", "c", "a", "d"]);
assert.deepEqual(moveItem(items, 3, 1).map((i) => i.mediaAssetId), ["a", "d", "b", "c"]);
assert.equal(moveItem(items, 1, 1), items);
assert.equal(moveItem(items, 0, -1), items);
assert.equal(moveItem(items, 0, 4), items);
assert.equal(moveItem(items, 9, 0), items);

const empty = emptyEditorState();
assert.deepEqual(empty.items, []);
assert.equal(empty.name, "");
assert.equal(empty.playback.playMode, "sequential");
assert.equal(defaultPlayback().transitionDuration, 1);

console.log("playlist-editor-state.check.mts OK");
