import assert from "node:assert/strict";
import { draftItemToPreview, playlistItemToPreview, playlistPreviewStage } from "./playlist-preview.ts";

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

// Playlist-level playback carried through, transitionDuration gains its unit, mediaFit passes through.
assert.deepEqual(stage.zones[0].playback, {
  playMode: "shuffle",
  repeat: "once",
  startFrom: "resume",
  defaultTransition: "fade",
  transitionDurationSeconds: 1.5,
  mediaFit: null,
});

// Empty name falls back; no playback -> undefined.
const bare = playlistPreviewStage({ name: "", items: [] });
assert.equal(bare.zones[0].name, "Playlist");
assert.equal(bare.zones[0].playback, undefined);

// ADR 0062 §7: mediaFit and transitionDurationSeconds survive the stage, not just the item shape.
const withOverrides = playlistPreviewStage({
  name: "Lobby loop",
  items: [{ mediaAssetId: "a", durationSeconds: 10, transition: "fade", transitionDurationSeconds: 2, mediaFit: "fill" }],
});
assert.equal(withOverrides.zones[0].items[0].transitionDurationSeconds, 2);
assert.equal(withOverrides.zones[0].items[0].mediaFit, "fill");

// draftItemToPreview: camelCase DraftItem -> canonical shape, `fit` renamed to `mediaFit`.
assert.deepEqual(
  draftItemToPreview({ mediaAssetId: "a", title: "Intro", durationSeconds: 10, transition: "cut", transitionDurationSeconds: 3, fit: "stretch" }),
  { mediaAssetId: "a", title: "Intro", durationSeconds: 10, transition: "cut", transitionDurationSeconds: 3, mediaFit: "stretch" },
);
// Missing optional fields resolve to null, not undefined — a dropped field must not silently vanish.
assert.deepEqual(
  draftItemToPreview({ mediaAssetId: "b", durationSeconds: null, transition: null }),
  { mediaAssetId: "b", title: null, durationSeconds: null, transition: null, transitionDurationSeconds: null, mediaFit: null },
);

// playlistItemToPreview: snake_case PlaylistItem -> canonical shape.
assert.deepEqual(
  playlistItemToPreview({ media_asset_id: "c", title: "Outro", duration_seconds: 8, transition: "fade", transition_duration_seconds: 1.5, fit: "fit" }),
  { mediaAssetId: "c", title: "Outro", durationSeconds: 8, transition: "fade", transitionDurationSeconds: 1.5, mediaFit: "fit" },
);

console.log("playlist-preview.check.mts OK");
