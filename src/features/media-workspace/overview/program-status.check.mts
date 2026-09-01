import assert from "node:assert/strict";
import { selectNextProgram, selectNowPlaying, type PlaybackCandidate } from "./program-status.ts";

const publications: PlaybackCandidate[] = [
  { id: "a", name: "One", publication_type: "playlist", targets: [{ status: "playing" }], publication_targets: [{ target_type: "channel" }], playback_window: { state: "open", next_opens_at: "2026-08-28T12:00:00Z" } },
  { id: "b", name: "Two", publication_type: "video", targets: [{ status: "playing" }, { status: "playing" }], publication_targets: [{ target_type: "device" }], playback_window: { state: "open", next_opens_at: "2026-08-28T11:00:00Z" } },
  { id: "ended", name: "Ended", publication_type: "video", targets: [{ status: "playing" }, { status: "playing" }, { status: "playing" }], playback_window: { state: "ended", next_opens_at: null } },
];

assert.equal(selectNowPlaying(publications)?.publication.id, "b");
assert.equal(selectNextProgram(publications, Date.parse("2026-08-28T10:00:00Z"))?.publication.id, "b");
assert.equal(selectNowPlaying([publications[2]]), null);
