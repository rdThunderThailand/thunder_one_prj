import assert from "node:assert/strict";
import { scheduleTime, targetSummary, todaysSchedule } from "./todays-schedule.ts";
import type { PublicationListItem } from "../publications/types/index.ts";

const row = (over: Partial<PublicationListItem>): PublicationListItem => ({
  id: "p1",
  name: "Publication",
  status: "active",
  publication_type: "playlist",
  priority: "normal",
  item_count: 1,
  tags: [],
  ...over,
});

// 2026-09-08T18:30Z is 2026-09-09 01:30 in Bangkok and 2026-09-08 14:30 in New York.
const now = new Date("2026-09-08T18:30:00Z");

// One instant, two zones, two answers: a Schedule is "today" in its own zone, not the viewer's.
// 10:00Z is the 8th in both zones — but "now" is already the 9th in Bangkok and still the 8th
// in New York, so only the New York row is today.
assert.deepEqual(
  todaysSchedule([
    row({ id: "bkk", starts_at: "2026-09-08T10:00:00Z", timezone: "Asia/Bangkok" }),
    row({ id: "nyc", starts_at: "2026-09-08T10:00:00Z", timezone: "America/New_York" }),
  ], now).map((r) => r.id),
  ["nyc"]
);

// No Schedule means no start, and no row.
assert.deepEqual(todaysSchedule([row({ id: "unscheduled" })], now), []);

// A row written before the zone existed is read as Bangkok, not as the viewer's zone.
assert.deepEqual(
  todaysSchedule([row({ id: "legacy", starts_at: "2026-09-08T20:00:00Z" })], now).map((r) => r.id),
  ["legacy"],
  "20:00Z is 2026-09-09 03:00 in Bangkok — the same Bangkok day as `now`"
);

// Earliest first, capped at the six the panel draws. 17:00Z–23:00Z on the 8th are all
// 2026-09-09 in Bangkok — the same Bangkok day as `now`.
assert.deepEqual(
  todaysSchedule(
    ["20", "18", "23", "17", "21", "19", "22"].map((h) =>
      row({ id: h, starts_at: `2026-09-08T${h}:00:00Z`, timezone: "Asia/Bangkok" })
    ),
    now
  ).map((r) => r.id),
  ["17", "18", "19", "20", "21", "22"]
);

// Targets read split, and an untargeted row says so rather than showing "0 Channels".
assert.equal(targetSummary({ channels: 2, devices: 1 }), "2 Channels · 1 Devices");
assert.equal(targetSummary({ channels: 2, devices: 0 }), "2 Channels");
assert.equal(targetSummary({ channels: 0, devices: 3 }), "3 Devices");
assert.equal(targetSummary({ channels: 0, devices: 0 }), "No targets");
assert.equal(targetSummary(undefined), "No targets", "a backend older than ADR 0065 §3");

// The clock is the Schedule's, not the viewer's.
assert.equal(scheduleTime(row({ starts_at: "2026-09-08T18:00:00Z", timezone: "America/New_York" })), "14:00");
assert.equal(scheduleTime(row({ starts_at: "2026-09-08T18:00:00Z" })), "01:00", "Bangkok fallback");

console.log("todays-schedule.check.mts — all assertions passed");
