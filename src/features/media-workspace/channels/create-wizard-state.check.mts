/** Run: node src/features/media-workspace/channels/create-wizard-state.check.mts */
import assert from "node:assert/strict";
import {
  DEFAULT_CREATE_CHANNEL_DRAFT,
  canvasResolutionFor,
  draftFromChannel,
  step1Valid,
  step2Valid,
  toCreateChannelPayload,
  toUpdateChannelPayload,
  withAutoMappedScreens,
} from "./create-wizard-state.ts";
import type { ChannelDetail } from "./types/index.ts";

assert.equal(step1Valid(DEFAULT_CREATE_CHANNEL_DRAFT), false);
assert.equal(step1Valid({ ...DEFAULT_CREATE_CHANNEL_DRAFT, name: "  " }), false);
assert.equal(step1Valid({ ...DEFAULT_CREATE_CHANNEL_DRAFT, name: "Cafe Menu Board" }), true);

assert.equal(step2Valid(DEFAULT_CREATE_CHANNEL_DRAFT), false);
assert.equal(step2Valid({ ...DEFAULT_CREATE_CHANNEL_DRAFT, playerId: "player-1" }), true);

// Single mode: no screens, canvas = the picked resolution directly.
assert.deepEqual(withAutoMappedScreens(DEFAULT_CREATE_CHANNEL_DRAFT).screens, []);
assert.equal(canvasResolutionFor(DEFAULT_CREATE_CHANNEL_DRAFT), "1920x1080");

// Multi mode: Auto Map seeds 1×3 = 3 screens; canvas is the derived total.
const multiDraft = withAutoMappedScreens({
  ...DEFAULT_CREATE_CHANNEL_DRAFT,
  displayMode: "multi",
  arrangementKey: "1x3",
});
assert.equal(multiDraft.screens.length, 3);
assert.equal(canvasResolutionFor(multiDraft), "5760x1080");

// Payload: single sends expected_resolution, no display_config.
const singlePayload = toCreateChannelPayload({ ...DEFAULT_CREATE_CHANNEL_DRAFT, playerId: "player-1", name: "Cafe" });
assert.equal(singlePayload.expected_resolution, "1920x1080");
assert.equal(singlePayload.display_config, null);
assert.equal(singlePayload.player_id, "player-1");

// Payload: multi sends display_config, no expected_resolution (server derives it).
const multiPayload = toCreateChannelPayload({ ...multiDraft, playerId: "player-1", name: "Cafe" });
assert.equal(multiPayload.expected_resolution, null);
assert.equal(multiPayload.display_config?.screens.length, 3);
assert.equal(multiPayload.display_config?.arrangement.cols, 3);

// Empty description trims to null, not "".
assert.equal(
  toCreateChannelPayload({ ...DEFAULT_CREATE_CHANNEL_DRAFT, playerId: "player-1", name: "Cafe", description: "  " })
    .description,
  null,
);

assert.throws(() => toCreateChannelPayload({ ...DEFAULT_CREATE_CHANNEL_DRAFT, name: "Cafe" }));

// toUpdateChannelPayload: same shape plus revision/overwrite.
const updatePayload = toUpdateChannelPayload({ ...DEFAULT_CREATE_CHANNEL_DRAFT, playerId: "player-1", name: "Cafe" }, 4);
assert.equal(updatePayload.expected_revision, 4);
assert.equal(updatePayload.overwrite, false);
assert.equal(updatePayload.player_id, "player-1");

function channelDetail(over: Partial<ChannelDetail> = {}): ChannelDetail {
  return {
    id: "ch-1",
    name: "Cafe Menu Board",
    description: "Menu display",
    lifecycle: "active",
    category: "dooh",
    channel_type: null,
    location: { id: "loc-1", name: "Main Restaurant" },
    player: { id: "player-1", name: "Player 01", code: "PLY-001", health: "online", last_heartbeat_at: null, orientation: "landscape", resolution: "1920x1080", sync_phase_error_ms: null, sync_loop_duration_seconds: null },
    health: "online",
    output_kind: "screen",
    display_config: null,
    groups: [],
    expected_orientation: "landscape",
    expected_resolution: "1920x1080",
    default_playlist: null,
    revision: 2,
    updated_at: "2026-09-14T00:00:00Z",
    created_at: "2026-08-01T00:00:00Z",
    ...over,
  };
}

// draftFromChannel: single-screen.
const singleDraft = draftFromChannel(channelDetail());
assert.equal(singleDraft.displayMode, "single");
assert.equal(singleDraft.playerId, "player-1");
assert.equal(singleDraft.locationId, "loc-1");
assert.equal(singleDraft.screenResolution, "1920x1080");

// draftFromChannel: multi-screen, arrangement round-trips to the matching preset key.
const multiChannel = channelDetail({
  display_config: {
    mode: "multi",
    arrangement: { rows: 1, cols: 3 },
    screens: [
      { index: 0, resolution: "1920x1080", output: "Output 1" },
      { index: 1, resolution: "1920x1080", output: "Output 2" },
      { index: 2, resolution: "1920x1080", output: "Output 3" },
    ],
  },
  expected_resolution: "5760x1080",
});
const multiDraftFromChannel = draftFromChannel(multiChannel);
assert.equal(multiDraftFromChannel.displayMode, "multi");
assert.equal(multiDraftFromChannel.arrangementKey, "1x3");
assert.equal(multiDraftFromChannel.screens.length, 3);

// draftFromChannel: Player-less Draft.
const draftChannel = channelDetail({ player: null, health: null });
assert.equal(draftFromChannel(draftChannel).playerId, null);

console.log("create-wizard-state.check.mts — all assertions passed");
