/**
 * Runnable check for the Edit page model (ADR 0080):
 *
 *     node src/features/media-workspace/publications/program-edit.check.mts
 */
import assert from "node:assert/strict";
import {
  buildUpdatePublishedBody,
  detailToEditState,
  editDisplayStatus,
  isProgramDirty,
  parseUpdatePublishedError,
  removedTargetLabels,
  targetDeviceIds,
} from "./program-edit.ts";
import type { PublicationDetail } from "./types";

const detail = {
  id: "p1",
  name: "Morning",
  description: undefined,
  publication_type: "playlist",
  priority: "normal",
  status: "active",
  tags: ["a"],
  playlist: { id: "pl1", name: "PL" },
  publication_targets: [
    { target_type: "channel", channel_id: "c1", name: "HQ" },
    { target_type: "group", group_id: "g1", name: "Lobby group" },
  ],
  schedule: { starts_at: "2026-10-01T00:00:00Z", ends_at: null, timezone: "Asia/Bangkok", recurrence: {} },
} as PublicationDetail;

const base = detailToEditState(detail);

// 1. untouched state is not dirty; any edit is
assert.equal(isProgramDirty(base, detailToEditState(detail)), false);
assert.equal(isProgramDirty(base, { ...base, name: "Evening" }), true);

// 2. playlist Program sends playlist_id, no items, no name on targets, no forbidden fields
const body = buildUpdatePublishedBody({ ...base, name: "  Morning " }, 4);
assert.equal(body.expected_revision, 4);
assert.equal(body.name, "Morning");
assert.equal(body.description, null);
assert.equal(body.playlist_id, "pl1");
assert.equal("items" in body, false);
assert.deepEqual(body.targets, [
  { target_type: "channel", channel_id: "c1" },
  { target_type: "group", group_id: "g1" },
]);
for (const key of ["campaign_id", "language", "metadata"]) assert.equal(key in body, false);

// 3. image Program sends items instead of a playlist
const image = detailToEditState(
  { ...detail, publication_type: "image" } as PublicationDetail,
  [{ media_asset_id: "m1", position: 0, duration_seconds: 10 }],
);
const imageBody = buildUpdatePublishedBody(image, 1);
assert.deepEqual(imageBody.items, [{ media_asset_id: "m1", duration_seconds: 10, transition: "cut" }]);
assert.equal("playlist_id" in imageBody, false);

// 4. removed targets: a Group counts once by name; unchanged targets do not
assert.deepEqual(removedTargetLabels(base.targets, base.targets.slice(0, 1)), ["Lobby group"]);
assert.deepEqual(removedTargetLabels(base.targets, base.targets), []);

// 5. error parsing binds a tagged message to its card and flags a stale revision
assert.deepEqual(parseUpdatePublishedError("[targets] Pick a channel"), {
  part: "targets",
  isStale: false,
  message: "Pick a channel",
});
assert.equal(parseUpdatePublishedError("Already modified: reload").isStale, true);
assert.equal(parseUpdatePublishedError("Program has ended").part, null);

// 6. a published Program without a schedule cannot be sent
assert.throws(() => buildUpdatePublishedBody({ ...base, schedule: null }, 1));

// 7. Groups expand to their member devices; unrelated Channels do not leak in
const channels = [
  { id: "c1", player: { id: "d1" }, groups: [] },
  { id: "c2", player: { id: "d2" }, groups: [{ id: "g1" }] },
  { id: "c3", player: null, groups: [{ id: "g1" }] },
  { id: "c4", player: { id: "d4" }, groups: [] },
];
assert.deepEqual(targetDeviceIds(channels, base.targets).sort(), ["d1", "d2"]);

// 8. display status precedence: Draft, Ended, Publishing (window open + waiting online), Live, Scheduled
const active = { status: "active", playback_window: { state: "open" as const }, targets: [] };
assert.equal(editDisplayStatus({ status: "draft" }), "draft");
assert.equal(editDisplayStatus({ ...active, effective_status: "ended" }), "ended");
assert.equal(editDisplayStatus({ ...active, status: "cancelled" }), "ended");
assert.equal(editDisplayStatus(active), "live");
assert.equal(editDisplayStatus({ ...active, targets: [{ status: "pending", status_level: "online" }] }), "publishing");
assert.equal(editDisplayStatus({ ...active, targets: [{ status: "pending", status_level: "offline" }] }), "live");
assert.equal(editDisplayStatus({ ...active, targets: [{ status: "failed", status_level: "online" }] }), "live");
assert.equal(editDisplayStatus({ ...active, playback_window: { state: "between" } }), "scheduled");

console.log("program-edit: ok");
