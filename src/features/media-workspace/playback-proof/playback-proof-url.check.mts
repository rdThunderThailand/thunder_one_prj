import assert from "node:assert/strict";
import { isValidCustomRange, rangeBounds, readPlaybackProofUrl, writePlaybackProofUrl } from "./playback-proof-url.ts";
import type { PlaybackProofEntry } from "./playback-proof-api.ts";
import { formatAirtime, formatBytes, formatDuration, formatPlayedAt, relatedLinks, sourceLabel } from "./playback-proof-view.ts";

const today = "2026-10-08";
const read = (qs: string) => readPlaybackProofUrl(new URLSearchParams(qs));

// Bare route = last 7 days, everything, page 1 — and it writes back to an empty query.
const bare = read("");
assert.deepEqual(bare.range, { kind: "preset", preset: "7d" });
assert.equal(writePlaybackProofUrl(bare).toString(), "");

// Presets → Bangkok-midnight bounds; the end is exclusive (midnight after the last day).
assert.deepEqual(rangeBounds({ kind: "preset", preset: "7d" }, today), { from: "2026-10-02T00:00:00+07:00", to: "2026-10-09T00:00:00+07:00" });
assert.deepEqual(rangeBounds({ kind: "preset", preset: "today" }, today), { from: "2026-10-08T00:00:00+07:00", to: "2026-10-09T00:00:00+07:00" });
assert.deepEqual(rangeBounds({ kind: "preset", preset: "yesterday" }, today), { from: "2026-10-07T00:00:00+07:00", to: "2026-10-08T00:00:00+07:00" });
assert.deepEqual(rangeBounds({ kind: "preset", preset: "30d" }, today), { from: "2026-09-09T00:00:00+07:00", to: "2026-10-09T00:00:00+07:00" });

// Custom range: 92 inclusive days is the limit; backwards, 93 days, or a bad date fall back to the default.
assert.equal(isValidCustomRange("2026-07-09", "2026-10-08"), true);
assert.equal(isValidCustomRange("2026-07-08", "2026-10-08"), false);
assert.equal(isValidCustomRange("2026-10-08", "2026-10-07"), false);
assert.deepEqual(read("from=2026-07-08&to=2026-10-08").range, { kind: "preset", preset: "7d" });
assert.deepEqual(read("from=2026-02-30&to=2026-03-01").range, { kind: "preset", preset: "7d" });
assert.deepEqual(read("range=bogus").range, { kind: "preset", preset: "7d" });

// Round trip of every filter.
const full = read("from=2026-09-01&to=2026-09-30&group=g1&program=unattributed&q=promo&page=3");
assert.deepEqual(full, {
  range: { kind: "custom", from: "2026-09-01", to: "2026-09-30" },
  scope: { kind: "group", id: "g1" },
  program: { kind: "unattributed" },
  q: "promo",
  page: 3,
});
assert.deepEqual(read(writePlaybackProofUrl(full).toString()), full);
assert.deepEqual(read("program=p1&page=0").program, { kind: "program", id: "p1" });
assert.equal(read("page=-2").page, 1);

// View helpers.
assert.equal(formatDuration(10), "0:10");
assert.equal(formatDuration(3725), "1:02:05");
assert.equal(formatAirtime(45), "45 s");
assert.equal(formatAirtime(7200), "2 h");
assert.equal(formatAirtime(12_000), "3 h 20 min");
assert.deepEqual(formatPlayedAt("2026-09-30T03:32:15Z", "Asia/Bangkok"), { date: "30 Sept 2026", time: "10:32:15" });
assert.equal(sourceLabel({ source: null, zone_name: null }), null);
assert.equal(sourceLabel({ source: { type: "composition", id: "c", name: "Lobby", in_trash: false }, zone_name: "Main" }), "Layout · Lobby (Main)");
assert.equal(sourceLabel({ source: { type: "media", id: null, name: null, in_trash: false }, zone_name: null }), "Media");

// Drawer: related links keep rows for Trash / unknown targets but drop the link (ADR 0089 §8).
assert.equal(formatBytes(1_258_291), "1.2 MB");
assert.equal(formatBytes(800), "1 KB");
const entry: PlaybackProofEntry = {
  id: "e1",
  played_at: "2026-09-30T03:32:15Z",
  duration_played_seconds: 10,
  outcome: "played",
  failure_reason: null,
  channel: { id: "c1", name: "Lobby", status: "active" },
  device: { id: "d1", name: "Player 01" },
  program: { id: "p1", name: "Morning", status: "active" },
  source: { type: "playlist", id: "pl1", name: "Morning Playlist", in_trash: false },
  zone_name: null,
  media: { id: "m1", title: "welcome.jpg", kind: "image", in_trash: false, width: 1920, height: 1080, duration_seconds: 10, mime_type: "image/jpeg", size_bytes: 1_258_291, thumbnail_url: null },
};
assert.deepEqual(relatedLinks(entry).map((link) => [link.label, link.href]), [
  ["Channel", "/media-workspace/channels?channel=c1"],
  ["Program", "/media-workspace/program/p1"],
  ["Playlist", "/media-workspace/playlists/pl1"],
  ["Media", "/media-workspace/assets/m1"],
]);
const unattributed = relatedLinks({ ...entry, channel: null, program: null, source: null, media: { ...entry.media, in_trash: true } });
assert.deepEqual(unattributed.map((link) => [link.label, link.href, link.note]), [
  ["Channel", null, "Not in a Channel when it played"],
  ["Media", null, "In Trash"],
]);
const trashedLayout = relatedLinks({ ...entry, source: { type: "composition", id: "c9", name: "Lobby", in_trash: true } });
assert.deepEqual(trashedLayout[2], { label: "Layout", name: "Lobby", href: null, note: "In Trash" });
// A hard-deleted Source keeps its row with no link (ADR 0089 §8), not hidden.
const goneLayout = relatedLinks({ ...entry, source: { type: "composition", id: null, name: null, in_trash: false } });
assert.deepEqual(goneLayout[2], { label: "Layout", name: "Layout", href: null, note: "No longer exists" });

console.log("playback proof url/view checks passed");
