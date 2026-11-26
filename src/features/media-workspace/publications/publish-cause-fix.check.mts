/**
 * node src/features/media-workspace/publications/publish-cause-fix.check.mts
 */
import assert from "node:assert/strict";
import { publishCauseFix, publishFixCard, type PublishFixContext } from "./publish-cause-fix.ts";

const layout: PublishFixContext = { type: "composition", playlistId: null, compositionId: "c1" };
const playlist: PublishFixContext = { type: "playlist", playlistId: "p1", compositionId: null };
const video: PublishFixContext = { type: "video", playlistId: null, compositionId: null };

// A file problem is fixed where the files live: the Layout, the Playlist, or step 2 for an image/video.
assert.deepEqual(publishCauseFix("files", layout), { kind: "link", href: "/media-workspace/layouts/c1", label: "เปิด Layout" });
assert.deepEqual(publishCauseFix("files", playlist), { kind: "link", href: "/media-workspace/playlists/p1", label: "เปิด Playlist" });
assert.equal(publishCauseFix("nothing-playable", video)?.kind, "step");
assert.equal((publishCauseFix("nothing-playable", video) as { step: number }).step, 2);

// Step 2 cannot fix a Playlist Program's files — it edits image/video items only.
assert.notEqual((publishCauseFix("files", playlist) as { kind: string }).kind, "step");

assert.equal((publishCauseFix("schedule-ended", video) as { step: number }).step, 3);
assert.equal((publishCauseFix("targets", layout) as { step: number }).step, 3);
assert.equal((publishCauseFix("no-content", playlist) as { step: number }).step, 1);
assert.equal(publishCauseFix("no-screens", layout)?.kind, "link");
assert.equal(publishCauseFix("zones-unbound", video), null); // no Layout bound, nothing to open

assert.equal(publishFixCard("schedule-invalid", 3), "schedule");
assert.equal(publishFixCard("targets", 3), "targets");
assert.equal(publishFixCard("channels-deleted", 3), "targets");
assert.equal((publishCauseFix("channels-deleted", layout) as { step: number }).step, 3);
assert.equal(publishFixCard("no-content", 1), "content");
assert.equal(publishFixCard("files", 2), "content");

console.log("publish-cause-fix.check.mts — all assertions passed");
