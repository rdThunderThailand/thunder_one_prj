/** Run: node src/features/media-workspace/channels/now-playing.check.mts */
import assert from "node:assert/strict";
import {
  indexNowNextByChannel,
  nowPlayingAllNames,
  nowPlayingName,
  nowPlayingRemaining,
  nowPlayingThumbnail,
  nowPlayingWindow,
} from "./now-playing.ts";
import type { NowNextOccurrence, NowNextRow } from "../publications/now-next.ts";

const single: NowNextOccurrence = {
  occurrence_id: "occ-1",
  opens_at: "2026-09-14T12:00:00Z",
  closes_at: "2026-09-14T14:00:00Z",
  remaining_seconds: 4800, // 1h 20m
  priority: "normal",
  output_kind: "publication",
  publications: [{ id: "pub-1", name: "Lunch Menu Publication", publication_type: "playlist", content_name: "Lunch Menu", thumbnail_url: "https://cdn/lunch.jpg" }],
  scheduled_now: true,
  playback_state: "confirmed",
  suppressed: [],
};

const merged: NowNextOccurrence = {
  ...single,
  occurrence_id: "occ-2",
  output_kind: "merged_loop",
  publications: [
    { id: "pub-1", name: "Lunch Menu Publication", publication_type: "playlist", content_name: "Lunch Menu", thumbnail_url: null },
    { id: "pub-2", name: "Promo Publication", publication_type: "playlist", content_name: "Promo Loop" },
    { id: "pub-3", name: "Weather Publication", publication_type: "playlist", content_name: null },
  ],
};

const rows: NowNextRow[] = [
  {
    row_type: "channel",
    channel: { id: "channel-1", name: "Cafe Menu Board" },
    device: null,
    devices: [],
    current: single,
    upcoming: [],
    suppressed_count: 0,
  },
  {
    row_type: "channel",
    channel: { id: "channel-2", name: "Idle Channel" },
    device: null,
    devices: [],
    current: null,
    upcoming: [],
    suppressed_count: 0,
  },
  {
    row_type: "channel",
    channel: { id: "channel-3", name: "Merged Loop Channel" },
    device: null,
    devices: [],
    current: merged,
    upcoming: [],
    suppressed_count: 0,
  },
  {
    row_type: "direct_device",
    channel: null,
    device: { id: "device-1", name: "Bare Screen" },
    devices: [],
    current: single,
    upcoming: [],
    suppressed_count: 0,
  },
];

const index = indexNowNextByChannel(rows);
assert.equal(index.size, 3); // direct_device rows are never indexed by Channel id
assert.equal(index.get("channel-1"), single);
assert.equal(index.get("channel-2"), null);
assert.equal(index.get("channel-3"), merged);
assert.equal(index.has("device-1"), false);
assert.equal(index.get("channel-missing"), undefined); // "not in the response" stays distinct from `null`

assert.equal(nowPlayingName(single), "Lunch Menu");
assert.equal(nowPlayingName(merged), "Lunch Menu +2 more");
assert.equal(nowPlayingName(null), "–");
assert.equal(nowPlayingName(undefined), "–");
assert.equal(nowPlayingName({ ...single, publications: [] }), "–");
assert.equal(
  nowPlayingName({ ...single, publications: [{ id: "p", name: "Fallback Name", publication_type: "image", content_name: null }] }),
  "Fallback Name",
);

assert.equal(nowPlayingThumbnail(single), "https://cdn/lunch.jpg");
assert.equal(nowPlayingThumbnail(merged), null); // first Publication has no thumbnail
assert.equal(nowPlayingThumbnail(null), null);

assert.equal(nowPlayingRemaining(single), "1h 20m left");
assert.equal(nowPlayingRemaining({ ...single, remaining_seconds: 90 }), "2m left");
assert.equal(nowPlayingRemaining({ ...single, remaining_seconds: 3600 }), "1h left");
assert.equal(nowPlayingRemaining({ ...single, remaining_seconds: 0 }), "0m left");
assert.equal(nowPlayingRemaining({ ...single, remaining_seconds: null }), null);
assert.equal(nowPlayingRemaining(null), null);

assert.deepEqual(nowPlayingAllNames(single), ["Lunch Menu"]);
assert.deepEqual(nowPlayingAllNames(merged), ["Lunch Menu", "Promo Loop", "Weather Publication"]);
assert.deepEqual(nowPlayingAllNames(null), []);
assert.deepEqual(nowPlayingAllNames(undefined), []);

assert.equal(nowPlayingWindow(single, "Asia/Bangkok"), "19:00 – 21:00");
assert.equal(nowPlayingWindow({ ...single, closes_at: null }, "Asia/Bangkok"), "19:00");
assert.equal(nowPlayingWindow(null, "Asia/Bangkok"), null);

console.log("now-playing.check.mts — all assertions passed");
