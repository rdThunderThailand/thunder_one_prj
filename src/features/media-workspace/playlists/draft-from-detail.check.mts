/**
 * Run: node src/features/playlists/draft-from-detail.check.mts
 *
 * Regression guard for the metadata-loss bug: restoring a fetched playlist into the
 * draft must carry `info`/`playback` through, not just name/items/revision.
 */
import assert from "node:assert/strict";
import { playlistDetailToDraftFields } from "./draft-from-detail.ts";
import type { PlaylistDetail } from "./types/index.ts";

const detail: PlaylistDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "On-air loop",
  status: "active",
  revision: 4,
  items: [
    { media_asset_id: "a-2", position: 1, transition: "cut" },
    {
      media_asset_id: "a-1",
      position: 0,
      transition: "fade",
      duration_seconds: 5,
      transition_duration_seconds: 2,
      fit: "fill",
      background_color: "#112233",
      notes: "keep tight",
    },
  ],
  metadata: {
    v: 1,
    info: { description: "Lobby screen", campaign_id: "c-1" },
    playback: { play_mode: "shuffle", audio_enabled: false },
  },
};

const fields = playlistDetailToDraftFields(detail);

assert.equal(fields.name, "On-air loop");
assert.equal(fields.playlistId, "11111111-1111-1111-1111-111111111111");
assert.equal(fields.revision, 4);

// Items are sorted by position and mapped to the wizard's shape.
assert.deepEqual(
  fields.items.map((i) => i.mediaAssetId),
  ["a-1", "a-2"]
);
assert.equal(fields.items[0].durationSeconds, 5);

// #37 per-item overrides carry through; unset on the second item stays undefined (inherit).
assert.equal(fields.items[0].transitionDurationSeconds, 2);
assert.equal(fields.items[0].fit, "fill");
assert.equal(fields.items[0].backgroundColor, "#112233");
assert.equal(fields.items[0].notes, "keep tight");
assert.equal(fields.items[1].transitionDurationSeconds, undefined);
assert.equal(fields.items[1].fit, undefined);

// The bug: metadata must decode into both halves, not be dropped.
assert.equal(fields.info.description, "Lobby screen");
assert.equal(fields.info.campaignId, "c-1");
assert.equal(fields.playback.playMode, "shuffle");
assert.equal(fields.playback.audioEnabled, false);

// A row with no metadata (pre-existing rows hold `{}`, or the field is absent) decodes
// to empty rather than crashing.
const bare = playlistDetailToDraftFields({ ...detail, metadata: undefined });
assert.deepEqual(bare.info, {});
assert.deepEqual(bare.playback, {});

console.log("draft-from-detail.check.mts — all assertions passed");
