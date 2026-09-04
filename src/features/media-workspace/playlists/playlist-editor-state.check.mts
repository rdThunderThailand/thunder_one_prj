import assert from "node:assert/strict";
import { appendItems, defaultPlayback, emptyEditorState, itemStartSeconds, moveItem } from "./playlist-editor-state.ts";

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

// appendItems: appends in selection order, skips dupes, video → null / image → default duration.
const pb = defaultPlayback();
const added = appendItems(items, [{ id: "e", kind: "video" }, { id: "b", kind: "image" }, { id: "f", kind: "image" }], pb);
assert.deepEqual(added.map((i) => i.mediaAssetId), ["a", "b", "c", "d", "e", "f"]);
assert.equal(added[4].durationSeconds, null);
assert.equal(added[5].durationSeconds, pb.defaultImageDuration ?? 10);
assert.equal(appendItems(items, [{ id: "a", kind: "image" }], pb), items);
assert.deepEqual(itemStartSeconds([
  { mediaAssetId: "asset-a", durationSeconds: 10, transition: "cut" },
  { mediaAssetId: "asset-b", durationSeconds: null, transition: "cut" },
  { mediaAssetId: "asset-c", durationSeconds: 5, transition: "cut" },
], [{ id: "asset-b", duration_seconds: 20 }]), [0, 10, 30]);

console.log("playlist-editor-state.check.mts OK");
