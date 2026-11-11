import assert from "node:assert/strict";
import {
  appendItems,
  defaultPlayback,
  duplicateItem,
  emptyEditorState,
  itemStartSeconds,
  moveItem,
  totalItemsDurationSeconds,
} from "./playlist-editor-state.ts";
import type { DraftItem } from "./types";

const items: DraftItem[] = ["a", "b", "c", "d"].map((id) => ({ key: `k-${id}`, mediaAssetId: id, durationSeconds: null, transition: "cut" as const }));

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

// appendItems: appends in selection order, repeats allowed (ADR 0103), video → null / image →
// default duration, every row gets its own key.
const pb = defaultPlayback();
const added = appendItems(items, [{ id: "e", kind: "video" }, { id: "b", kind: "image" }, { id: "f", kind: "image" }], pb);
assert.deepEqual(added.map((i) => i.mediaAssetId), ["a", "b", "c", "d", "e", "b", "f"]);
assert.equal(added[4].durationSeconds, null);
assert.equal(added[6].durationSeconds, pb.defaultImageDuration ?? 10);
assert.equal(new Set(added.map((i) => i.key)).size, added.length);
assert.equal(appendItems(items, [], pb), items);

// duplicateItem: the copy keeps its overrides, lands right after, under a new key.
const withOverride = items.map((i) => (i.key === "k-b" ? { ...i, durationSeconds: 7, notes: "x" } : i));
const duped = duplicateItem(withOverride, "k-b");
assert.deepEqual(duped.map((i) => i.mediaAssetId), ["a", "b", "b", "c", "d"]);
assert.equal(duped[2].durationSeconds, 7);
assert.equal(duped[2].notes, "x");
assert.notEqual(duped[2].key, "k-b");
assert.equal(duplicateItem(items, "missing"), items);
assert.deepEqual(itemStartSeconds([
  { key: "k-a", mediaAssetId: "asset-a", durationSeconds: 10, transition: "cut" },
  { key: "k-b", mediaAssetId: "asset-b", durationSeconds: null, transition: "cut" },
  { key: "k-c", mediaAssetId: "asset-c", durationSeconds: 5, transition: "cut" },
], [{ id: "asset-b", duration_seconds: 20 }], { ...pb, repeat: "loop" }), [0, 10, 30]);

// ADR 0094: a fade overlaps the start of its incoming item and adds no time, so the editor's total
// is media-only for `once` and `loop` alike — the loop_duration the device receives.
const fadeItems = ["a", "b", "c"].map((id) => ({ key: id, mediaAssetId: id, durationSeconds: 10, transition: "fade" as const }));
assert.equal(totalItemsDurationSeconds(fadeItems, [], { ...pb, repeat: "once" }), 30);
assert.deepEqual(itemStartSeconds(fadeItems, [], { ...pb, repeat: "once" }), [0, 10, 20]);
assert.equal(totalItemsDurationSeconds(fadeItems, [], { ...pb, repeat: "loop" }), 30);

console.log("playlist-editor-state.check.mts OK");
