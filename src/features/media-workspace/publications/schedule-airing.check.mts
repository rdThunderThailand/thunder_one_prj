/**
 * Runnable check for when a stored schedule airs, ends and is described:
 *
 *     node src/features/media-workspace/publications/schedule-airing.check.mts
 */
import assert from "node:assert/strict";
import { shiftYmd } from "./schedule.ts";
import {
  airsOn,
  describeSchedule,
  hasAiringLeft,
  lastAiring,
  lastAiringDay,
  scheduleEdges,
  upcomingDays,
} from "./schedule-airing.ts";
import { applyPreset, scheduleToDraft, toStoredSchedule } from "./schedule-preset.ts";
import type { ScheduleDraft } from "./schedule-preset.ts";
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
assert.equal(describeSchedule(dates).range, "15/06/2027 – 22/06/2027");
assert.equal(describeSchedule(dates).title, "3 custom dates");

// Weekly with an end: the stored all-day end (next midnight) reads back as the last day.
const weekly: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-10-31T17:00:00.000Z",
  timezone: TZ,
  recurrence: { freq: "weekly", days: [0, 1, 2, 3, 4, 5, 6], daily_start: "06:00", daily_end: "10:00" },
};
assert.equal(describeSchedule(weekly).range, "01/10/2026 – 31/10/2026");
assert.equal(describeSchedule(weekly).title, "Every day");
assert.equal(describeSchedule(weekly).hours, "06:00 – 10:00");

// Open-ended.
const open: PublicationSchedule = { ...weekly, ends_at: null };
assert.equal(lastAiringDay(open), null);
assert.equal(describeSchedule(open).range, "From 01/10/2026 · No end date");

// One-off: all-day one-time shows its single day; a timed one-off keeps its times.
const allDay: PublicationSchedule = {
  starts_at: "2026-10-02T17:00:00.000Z",
  ends_at: "2026-10-03T17:00:00.000Z",
  timezone: TZ,
  recurrence: {},
};
assert.deepEqual(describeSchedule(allDay), { title: "One time", hours: "All day", range: "03/10/2026", days: [] });
const timed: PublicationSchedule = { ...allDay, starts_at: "2026-10-03T03:00:00.000Z", ends_at: "2026-10-05T11:00:00.000Z" };
assert.equal(describeSchedule(timed).range, "03/10/2026 10:00 – 05/10/2026 18:00");
// A one-off past its start day, or open-ended, is Continuous — the same split scheduleToDraft makes (#199).
assert.equal(describeSchedule(timed).title, "Continuous");
assert.equal(describeSchedule({ ...timed, ends_at: null }).title, "Continuous");
assert.equal(describeSchedule({ ...timed, ends_at: "2026-10-03T11:00:00.000Z" }).title, "One time");

// Edges agree with the summary: a Continuous ending at midnight keeps that midnight; only the
// all-day one-time shape reads back as its own day until 23:59.
const toMidnight: PublicationSchedule = { ...allDay, starts_at: "2026-10-20T08:48:00.000Z", ends_at: "2026-11-04T17:00:00.000Z" };
assert.equal(describeSchedule(toMidnight).range, "20/10/2026 15:48 – 05/11/2026 00:00");
assert.equal(scheduleEdges(toMidnight).endDate, "2026-11-05");
assert.equal(scheduleEdges(toMidnight).endTime, "00:00");
assert.equal(scheduleEdges(allDay).endDate, "2026-10-03");
assert.equal(scheduleEdges(allDay).endTime, "23:59");

// Monthly.
const monthly: PublicationSchedule = {
  ...weekly,
  ends_at: null,
  recurrence: { freq: "monthly", month_days: [15, 1], daily_start: "09:00", daily_end: "18:00" },
};
assert.equal(describeSchedule(monthly).title, "Day 1, 15");

// --- airsOn / upcomingDays / hasAiringLeft / lastAiring (ADR 0128) ---
// A Draft is read through toStoredSchedule: the module only knows the stored shape.
const TODAY = "2026-10-01"; // a Thursday
const at = (iso: string) => new Date(iso);
const draftOf = (s: PublicationSchedule) => scheduleToDraft(s, TODAY, TZ);
const storedOf = (draft: ScheduleDraft): PublicationSchedule => {
  const stored = toStoredSchedule(draft);
  assert.ok(stored);
  return stored;
};

// Weekdays with an end date, 1 Oct (Thu) to 31 Oct.
const weekdays: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-10-31T17:00:00.000Z",
  timezone: TZ,
  recurrence: { freq: "weekly", days: [1, 2, 3, 4, 5], daily_start: "06:00", daily_end: "10:00" },
};
assert.deepEqual(upcomingDays(storedOf(draftOf(weekdays)), TODAY, 3), ["2026-10-01", "2026-10-02", "2026-10-05"]);

const monthlyRange: PublicationSchedule = {
  ...weekdays,
  recurrence: { freq: "monthly", month_days: [1, 15, 31], daily_start: "08:00", daily_end: "09:00" },
};
const monthlyDraft = draftOf(monthlyRange);
assert.deepEqual(upcomingDays(storedOf(monthlyDraft), TODAY, 2), ["2026-10-01", "2026-10-15"]);

// Monthly skips a day a month does not have (no roll-over): [19, 31] in a 30-day month airs on the 19th only.
const airingIn = (draft: ScheduleDraft, from: string, to: string) => {
  const stored = storedOf(draft);
  const days: string[] = [];
  for (let ymd = from; ymd <= to; ymd = shiftYmd(ymd, 1)) if (airsOn(stored, ymd)) days.push(ymd.slice(8));
  return days;
};
const m1931 = { ...monthlyDraft, monthDays: [19, 31], endDate: "" };
assert.deepEqual(airingIn(m1931, "2026-11-01", "2026-11-30"), ["19"]);
assert.deepEqual(airingIn(m1931, "2026-12-01", "2026-12-31"), ["19", "31"]);
assert.deepEqual(airingIn({ ...m1931, monthDays: [29] }, "2027-02-01", "2027-02-28"), []);
assert.deepEqual(airingIn({ ...m1931, monthDays: [29] }, "2028-02-01", "2028-02-29"), ["29"]);

// One-offs: day granularity from the start day to the inclusive last day.
const continuous: PublicationSchedule = {
  starts_at: "2026-10-03T03:00:00.000Z", // 3 Oct 10:00 +07
  ends_at: "2026-10-05T11:00:00.000Z", // 5 Oct 18:00 +07
  timezone: TZ,
  recurrence: {},
};
const continuousDraft = draftOf(continuous);
assert.deepEqual(upcomingDays(continuous, "2026-10-01", 5), ["2026-10-03", "2026-10-04", "2026-10-05"]);
// An end at exactly 00:00 does not air on that day.
const endsAtMidnight = storedOf({ ...continuousDraft, endDate: "2026-10-05", endTime: "00:00" });
assert.equal(upcomingDays(endsAtMidnight, "2026-10-01", 5).includes("2026-10-05"), false);
assert.equal(airsOn(endsAtMidnight, "2026-10-04"), true);
assert.equal(airsOn(endsAtMidnight, "2026-10-05"), false);
// Open continuous: every day from its start.
const openContinuous: PublicationSchedule = { starts_at: "2026-09-30T02:00:00.000Z", ends_at: null, timezone: TZ, recurrence: {} };
assert.deepEqual(upcomingDays(openContinuous, TODAY, 3), ["2026-10-01", "2026-10-02", "2026-10-03"]);
assert.equal(airsOn(openContinuous, "2026-09-29"), false);
// One-time, timed and all day.
const timedOneTime = storedOf({ ...applyPreset(draftOf(weekdays), "one-time", TODAY), startDate: "2026-10-05", dailyStart: "09:00", dailyEnd: "17:00" });
assert.deepEqual([airsOn(timedOneTime, "2026-10-04"), airsOn(timedOneTime, "2026-10-05"), airsOn(timedOneTime, "2026-10-06")], [false, true, false]);
const allDayOneTime = storedOf({ ...applyPreset(draftOf(weekdays), "one-time", TODAY), startDate: "2026-10-05", allDay: true });
assert.deepEqual([airsOn(allDayOneTime, "2026-10-04"), airsOn(allDayOneTime, "2026-10-05"), airsOn(allDayOneTime, "2026-10-06")], [false, true, false]);

// The 23:59 rule (ADR 0128 §3): a daily end of 23:59 plays through the end of the local day.
const monthlyLastDay: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-12-18T17:00:00.000Z", // midnight after 18 Dec
  timezone: TZ,
  recurrence: { freq: "monthly", month_days: [18], daily_start: "09:00", daily_end: "23:59" },
};
assert.equal(hasAiringLeft(monthlyLastDay, at("2026-12-18T16:59:30Z")), true); // 18 Dec 23:59:30
assert.equal(hasAiringLeft(monthlyLastDay, at("2026-12-18T17:00:30Z")), false); // 19 Dec 00:00:30
const weeklyLastDay: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-10-30T17:00:00.000Z", // midnight after Fri 30 Oct
  timezone: TZ,
  recurrence: { freq: "weekly", days: [1, 2, 3, 4, 5], daily_start: "09:00", daily_end: "17:00" },
};
assert.equal(hasAiringLeft(weeklyLastDay, at("2026-10-30T09:59:30Z")), true); // Fri 16:59:30
assert.equal(hasAiringLeft(weeklyLastDay, at("2026-10-30T10:00:30Z")), false); // Fri 17:00:30
// ADR 0128 §9: was false before; Core plays custom dates through midnight.
assert.equal(hasAiringLeft(dates, at("2027-06-22T16:59:30Z")), true); // 22 Jun 23:59:30
assert.equal(hasAiringLeft(dates, at("2027-06-22T17:00:30Z")), false);
// A one-off stops at its stored end, so a one-time 11:00-23:59 is over at 23:59:30.
const oneTimeToMidnight: PublicationSchedule = {
  starts_at: "2026-10-05T04:00:00.000Z", // 11:00
  ends_at: "2026-10-05T16:59:00.000Z", // 23:59
  timezone: TZ,
  recurrence: {},
};
assert.equal(hasAiringLeft(oneTimeToMidnight, at("2026-10-05T16:58:30Z")), true);
assert.equal(hasAiringLeft(oneTimeToMidnight, at("2026-10-05T16:59:30Z")), false);
assert.equal(hasAiringLeft(openContinuous, at("2030-01-01T00:00:00Z")), true);

// lastAiring: the last window that actually happens, as stored.
const sundayEnd: PublicationSchedule = { ...weeklyLastDay, ends_at: "2026-11-01T17:00:00.000Z" }; // range ends Sun 1 Nov
assert.deepEqual(lastAiring(sundayEnd), { date: "2026-10-30", time: "17:00" });
const weeklyAllDay: PublicationSchedule = {
  ...sundayEnd,
  recurrence: { freq: "weekly", days: [1, 2, 3, 4, 5], daily_start: "00:00", daily_end: "23:59" },
};
assert.deepEqual(lastAiring(weeklyAllDay), { date: "2026-10-30", time: "23:59" });
assert.deepEqual(lastAiring(dates), { date: "2027-06-22", time: "23:59" });
assert.deepEqual(lastAiring(continuous), { date: "2026-10-05", time: "18:00" });
assert.equal(lastAiring({ ...weeklyLastDay, ends_at: null }), null);
assert.equal(lastAiring(openContinuous), null);
// Sat 3 Oct to Sun 4 Oct, Mon-Fri only: nothing ever airs.
assert.equal(lastAiring({ ...weeklyLastDay, starts_at: "2026-10-02T17:00:00.000Z", ends_at: "2026-10-04T17:00:00.000Z" }), null);

// toStoredSchedule never throws: null while a draft cannot be converted.
const weeklyDraft = draftOf(weekdays);
assert.equal(toStoredSchedule({ ...weeklyDraft, startDate: "" }), null);
assert.equal(toStoredSchedule({ ...weeklyDraft, mode: "dates", dates: [] }), null);
assert.ok(toStoredSchedule({ ...weeklyDraft, mode: "dates", dates: ["2026-10-05"], startDate: "" }));

console.log("schedule-airing.check.mts: ok");
