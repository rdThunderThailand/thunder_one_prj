/**
 * Runnable check for the schedule summary formatter:
 *
 *     node src/features/media-workspace/publications/schedule-describe.check.mts
 */
import assert from "node:assert/strict";
import { describeSchedule, lastAiringDay } from "./schedule-describe.ts";
import type { PublicationSchedule } from "./types/index.ts";

const TZ = "Asia/Bangkok"; // UTC+7, no DST

// Custom days: the range ends on the last date, not the midnight after it ("15, 16, 22 Jun").
const dates: PublicationSchedule = {
  starts_at: "2027-06-14T17:00:00.000Z",
  ends_at: "2027-06-22T17:00:00.000Z",
  timezone: TZ,
  recurrence: { freq: "dates", dates: ["2027-06-22", "2027-06-15", "2027-06-16"], daily_start: "00:00", daily_end: "23:59" },
};
assert.equal(lastAiringDay(dates), "2027-06-22");
assert.equal(describeSchedule(dates).range, "2027-06-15 – 2027-06-22");
assert.equal(describeSchedule(dates).title, "3 custom dates");

// Weekly with an end: the stored all-day end (next midnight) reads back as the last day.
const weekly: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-10-31T17:00:00.000Z",
  timezone: TZ,
  recurrence: { freq: "weekly", days: [0, 1, 2, 3, 4, 5, 6], daily_start: "06:00", daily_end: "10:00" },
};
assert.equal(describeSchedule(weekly).range, "2026-10-01 – 2026-10-31");
assert.equal(describeSchedule(weekly).title, "Every day");
assert.equal(describeSchedule(weekly).hours, "06:00 – 10:00");

// Open-ended.
const open: PublicationSchedule = { ...weekly, ends_at: null };
assert.equal(lastAiringDay(open), null);
assert.equal(describeSchedule(open).range, "From 2026-10-01 · No end date");

// One-off: all-day one-time shows its single day; a timed one-off keeps its times.
const allDay: PublicationSchedule = {
  starts_at: "2026-10-02T17:00:00.000Z",
  ends_at: "2026-10-03T17:00:00.000Z",
  timezone: TZ,
  recurrence: {},
};
assert.deepEqual(describeSchedule(allDay), { title: "One time", hours: "All day", range: "2026-10-03", days: [] });
const timed: PublicationSchedule = { ...allDay, starts_at: "2026-10-03T03:00:00.000Z", ends_at: "2026-10-05T11:00:00.000Z" };
assert.equal(describeSchedule(timed).range, "2026-10-03 10:00 – 2026-10-05 18:00");

// Monthly.
const monthly: PublicationSchedule = {
  ...weekly,
  ends_at: null,
  recurrence: { freq: "monthly", month_days: [15, 1], daily_start: "09:00", daily_end: "18:00" },
};
assert.equal(describeSchedule(monthly).title, "Day 1, 15");

console.log("schedule-describe.check.mts: ok");
