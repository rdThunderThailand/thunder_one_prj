import assert from "node:assert/strict";
import { playlistPreviewStage } from "./playlist-preview.ts";

// One full-frame Zone, always.
const stage = playlistPreviewStage({
  name: "Lobby loop",
  items: [
    { mediaAssetId: "a", title: "Intro", durationSeconds: 10, transition: "fade" },
    { mediaAssetId: "b", title: null, durationSeconds: null, transition: null },
  ],
  playback: { playMode: "shuffle", repeat: "once", startFrom: "resume", defaultTransition: "fade", transitionDuration: 1.5 },
});

assert.equal(stage.zones.length, 1);
assert.equal(stage.referenceResolution, null);
assert.deepEqual(
  { x: stage.zones[0].x, y: stage.zones[0].y, width: stage.zones[0].width, height: stage.zones[0].height },
  { x: 0, y: 0, width: 100, height: 100 },
);
assert.equal(stage.zones[0].name, "Lobby loop");

// Item mapping: title -> label, missing title -> undefined.
assert.equal(stage.zones[0].items[0].label, "Intro");
assert.equal(stage.zones[0].items[1].label, undefined);

// Nullable duration passes straight through — PreviewStage applies COALESCE(item, asset), not the adapter.
assert.equal(stage.zones[0].items[0].durationSeconds, 10);
assert.equal(stage.zones[0].items[1].durationSeconds, null);

// Playlist-level playback carried through, transitionDuration gains its unit.
assert.deepEqual(stage.zones[0].playback, {
  playMode: "shuffle",
  repeat: "once",
  startFrom: "resume",
  defaultTransition: "fade",
  transitionDurationSeconds: 1.5,
});

// Empty name falls back; no playback -> undefined.
const bare = playlistPreviewStage({ name: "", items: [] });
assert.equal(bare.zones[0].name, "Playlist");
assert.equal(bare.zones[0].playback, undefined);

console.log("playlist-preview.check.mts OK");
