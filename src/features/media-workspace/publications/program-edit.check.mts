/**
 * Runnable check for the Edit page model (ADR 0080):
 *
 *     node src/features/media-workspace/publications/program-edit.check.mts
 */
import assert from "node:assert/strict";
import {
  buildUpdatePublishedBody,
  checkEditConflicts,
  compositionContent,
  detailToEditState,
  isProgramDirty,
  parseUpdatePublishedError,
  playlistContent,
  programEditSubtitle,
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
assert.equal(programEditSubtitle(base), "Playlist: PL · 1 Channel · 1 Group");
assert.equal(programEditSubtitle({ ...base, content: compositionContent({ id: "layout", name: "New Layout" }), targets: [] }), "Layout: New Layout · No target");
assert.equal(programEditSubtitle({ ...base, targets: [{ target_type: "device", device_id: "d1" }, { target_type: "device", device_id: "d2" }] }), "Playlist: PL · 2 Devices");

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

// Each open uses current Channel membership; unavailable metadata must not mean "no conflicts".
let lookups = 0;
const requests: Parameters<Parameters<typeof checkEditConflicts>[3]>[0][] = [];
const loadChannels = async () => {
  lookups += 1;
  return lookups === 1 ? channels : [{ ...channels[0], player: { id: "d5" } }];
};
const checkConflicts = async (input: (typeof requests)[number]) => {
  requests.push(input);
  return [];
};
await checkEditConflicts("p1", base, loadChannels, checkConflicts);
await checkEditConflicts("p1", { ...base, priority: "high" }, loadChannels, checkConflicts);
assert.equal(lookups, 2);
assert.deepEqual(requests.map((request) => request.device_ids.sort()), [["d1", "d2"], ["d5"]]);
assert.equal(requests[1].priority, "high");
assert.equal(requests[1].publication_id, "p1");
assert.equal(requests[1].starts_at, base.schedule!.starts_at);
const unavailable = async () => { throw new Error("Channel metadata unavailable"); };
await assert.rejects(checkEditConflicts("p1", base, unavailable, checkConflicts), /metadata unavailable/);
assert.equal(requests.length, 2, "Failed metadata must not submit an empty device check");
await checkEditConflicts("p1", {
  ...base,
  targets: [{ target_type: "device", device_id: "d7" }],
}, unavailable, checkConflicts);
assert.deepEqual(requests[2].device_ids, ["d7"], "Direct device must bypass Channel lookup");
await checkEditConflicts("p1", { ...base, schedule: null }, unavailable, checkConflicts);
assert.equal(requests.length, 3, "Missing schedule must retain the existing no-check behavior");

// Change Playlist / Layout: items sorted by position; the other side's id is cleared; the change is dirty.
const changed = playlistContent({
  id: "pl2",
  name: "New",
  items: [
    { media_asset_id: "b", position: 1 },
    { media_asset_id: "a", position: 0, transition: "fade" },
  ],
});
assert.deepEqual(changed.items.map((i) => i.media_asset_id), ["a", "b"]);
assert.equal(changed.items[0].transition, "fade");
assert.equal(changed.compositionId, null);
assert.deepEqual(compositionContent({ id: "c2", name: "Lay" }), {
  type: "composition", name: "Lay", playlistId: null, compositionId: "c2", items: [],
});
assert.equal(isProgramDirty(base, { ...base, content: changed }), true);

console.log("program-edit: ok");
