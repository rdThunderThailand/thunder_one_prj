/**
 * Run: node src/features/playlists/metadata.check.mts
 *
 * Covers the two things that silently corrupt data if they break: the encode → decode
 * round trip, and the cover fallback that the list and detail views both render off.
 */
import assert from "node:assert/strict";
import { decodeMetadata, encodeMetadata, resolveCoverAssetId } from "./metadata.ts";
import type { PlaylistMetadata } from "./types/index.ts";

const full: PlaylistMetadata = {
  info: {
    description: "Weekly promo",
    campaignId: "c-1",
    tags: ["t-1", "t-2"],
    playlistType: "standard",
    resolution: "1920x1080",
    // width/height are derived from resolution on decode (ADR 0032), so the round trip adds them back.
    width: 1920,
    height: 1080,
    frameRate: 30,
    coverAssetId: "a-9",
  },
  playback: {
    playMode: "sequential",
    repeat: "loop",
    startFrom: "first",
    defaultImageDuration: 10,
    mediaFit: "fit",
    audioEnabled: true,
    defaultVolume: 80,
    defaultTransition: "fade",
    transitionDuration: 1,
    failureHandling: "skip",
    warnOnSkip: true,
  },
};

// Round trip preserves every field.
assert.deepEqual(decodeMetadata(encodeMetadata(full)), full);

// Empty values are never written — a blank wizard produces just the version marker.
assert.deepEqual(encodeMetadata({ info: { description: "" }, playback: {} }), { v: 1 });

// `false` and `0` are values, not emptiness.
const zeroed = encodeMetadata({
  info: {},
  playback: { audioEnabled: false, defaultVolume: 0 },
});
assert.deepEqual(zeroed, { v: 1, playback: { audio_enabled: false, default_volume: 0 } });
assert.equal(decodeMetadata(zeroed).playback.audioEnabled, false);
assert.equal(decodeMetadata(zeroed).playback.defaultVolume, 0);

// Pre-existing rows hold `{}`; unknown versions and junk decode to empty instead of throwing.
const empty = { info: {}, playback: {} };
assert.deepEqual(decodeMetadata({}), empty);
assert.deepEqual(decodeMetadata(null), empty);
assert.deepEqual(decodeMetadata("nonsense"), empty);
assert.deepEqual(decodeMetadata([1, 2]), empty);
assert.deepEqual(decodeMetadata({ v: 99, info: { description: "future" } }), empty);

// start_from "resume" survives the round trip (added alongside "first").
const resumed = encodeMetadata({ info: {}, playback: { startFrom: "resume" } });
assert.deepEqual(resumed, { v: 1, playback: { start_from: "resume" } });
assert.equal(decodeMetadata(resumed).playback.startFrom, "resume");

// Values outside the allowed set are dropped, not passed through to a <select>.
assert.equal(decodeMetadata({ v: 1, playback: { media_fit: "cover" } }).playback.mediaFit, undefined);
assert.equal(decodeMetadata({ v: 1, info: { frame_rate: "30" } }).info.frameRate, undefined);

// Cover: explicit pick wins.
const items = [
  { media_asset_id: "a-2", position: 1 },
  { media_asset_id: "a-1", position: 0 },
];
assert.equal(resolveCoverAssetId("a-9", items), "a-9");

// No pick: lowest position wins, regardless of array order.
assert.equal(resolveCoverAssetId(undefined, items), "a-1");
assert.equal(resolveCoverAssetId(undefined, []), undefined);

console.log("metadata.check.mts — all assertions passed");
