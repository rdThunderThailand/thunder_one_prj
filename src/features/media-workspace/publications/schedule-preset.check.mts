/**
 * Runnable check for the Edit Schedule preset mapping:
 *
 *     node src/features/media-workspace/publications/schedule-preset.check.mts
 */
import assert from "node:assert/strict";
import {
  applyPreset,
  draftToSchedule,
  presetOf,
  scheduleToDraft,
  upcomingDays,
  validateDraft,
  windowLabel,
} from "./schedule-preset.ts";
import type { PublicationSchedule } from "./types/index.ts";

const TZ = "Asia/Bangkok"; // UTC+7, no DST
const TODAY = "2026-10-01"; // a Thursday
const roundTrip = (s: PublicationSchedule) => draftToSchedule(scheduleToDraft(s, TODAY, TZ));

// Weekly with an end date: stored end = midnight after the last day, read back inclusively.
const weekly: PublicationSchedule = {
  starts_at: "2026-09-30T17:00:00.000Z",
  ends_at: "2026-10-31T17:00:00.000Z",
  timezone: TZ,
  recurrence: { freq: "weekly", days: [1, 2, 3, 4, 5], daily_start: "06:00", daily_end: "10:00" },
};
const weeklyDraft = scheduleToDraft(weekly, TODAY, TZ);
assert.equal(weeklyDraft.startDate, "2026-10-01");
assert.equal(weeklyDraft.endDate, "2026-10-31");
assert.equal(presetOf(weeklyDraft), "weekdays");
assert.deepEqual(roundTrip(weekly), weekly);

// 7 days: with an end date it is Date range, without it Every day.
const everyday = applyPreset(weeklyDraft, "everyday", TODAY);
assert.equal(presetOf(everyday), "everyday");
assert.equal(draftToSchedule(everyday).ends_at, null);
const range = applyPreset(everyday, "date-range", TODAY);
assert.equal(presetOf(range), "date-range");
assert.equal(range.endDate, "2026-10-31");
assert.equal(presetOf({ ...weeklyDraft, days: [1, 3] }), null, "a custom weekday set highlights nothing");

// Custom days: sorted, unique; range = first window start to last window end.
const dates = draftToSchedule({ ...applyPreset(weeklyDraft, "custom-days", TODAY), dates: ["2026-11-10", "2026-11-03", "2026-11-10"] });
assert.deepEqual(dates.recurrence, { freq: "dates", dates: ["2026-11-03", "2026-11-10"], daily_start: "06:00", daily_end: "10:00" });
assert.equal(dates.starts_at, "2026-11-02T23:00:00.000Z");
assert.equal(dates.ends_at, "2026-11-10T03:00:00.000Z");
assert.equal(presetOf(scheduleToDraft(dates, TODAY, TZ)), "custom-days");

// One-time, all day: closes at the next midnight and reads back as one-time.
const oneTime = draftToSchedule({ ...applyPreset(weeklyDraft, "one-time", TODAY), startDate: "2026-10-05", allDay: true });
assert.deepEqual(oneTime, { starts_at: "2026-10-04T17:00:00.000Z", ends_at: "2026-10-05T17:00:00.000Z", timezone: TZ, recurrence: {} });
assert.equal(presetOf(scheduleToDraft(oneTime, TODAY, TZ)), "one-time");

// Monthly: stored as `monthly`, round-trips, and applying the preset seeds the start day.
const monthly: PublicationSchedule = {
  ...weekly,
  recurrence: { freq: "monthly", month_days: [1, 15, 31], daily_start: "08:00", daily_end: "09:00" },
};
const monthlyDraft = scheduleToDraft(monthly, TODAY, TZ);
assert.equal(presetOf(monthlyDraft), "monthly");
assert.deepEqual(roundTrip(monthly), monthly);
assert.deepEqual(upcomingDays(monthlyDraft, TODAY, 2), ["2026-10-01", "2026-10-15"]);
assert.deepEqual(applyPreset(weeklyDraft, "monthly", "2026-10-07").monthDays, [1], "seeds from the start date (01 here)");
assert.deepEqual(applyPreset({ ...weeklyDraft, startDate: "" }, "monthly", "2026-10-07").monthDays, [7]);
assert.ok(validateDraft({ ...monthlyDraft, monthDays: [] }, TODAY).monthDays);
assert.deepEqual(validateDraft(monthlyDraft, TODAY), {});

// Continuous: a multi-day one-off with times, no daily window; round-trips.
const continuous: PublicationSchedule = {
  starts_at: "2026-10-03T03:00:00.000Z", // 3 Oct 10:00 +07
  ends_at: "2026-10-05T11:00:00.000Z", // 5 Oct 18:00 +07
  timezone: TZ,
  recurrence: {},
};
const continuousDraft = scheduleToDraft(continuous, TODAY, TZ);
assert.equal(presetOf(continuousDraft), "continuous");
assert.deepEqual(
  [continuousDraft.startDate, continuousDraft.startTime, continuousDraft.endDate, continuousDraft.endTime],
  ["2026-10-03", "10:00", "2026-10-05", "18:00"],
);
assert.deepEqual(roundTrip(continuous), continuous);
assert.deepEqual(upcomingDays(continuousDraft, "2026-10-01", 5), ["2026-10-03", "2026-10-04", "2026-10-05"]);
assert.deepEqual(validateDraft(continuousDraft, TODAY), {});
assert.ok(validateDraft({ ...continuousDraft, endDate: "2026-10-03", endTime: "09:00" }, TODAY).endDate, "end before start");
// An open-ended one-off is Continuous with no end; picking another preset overwrites it.
const open: PublicationSchedule = { starts_at: "2026-09-30T02:00:00.000Z", ends_at: null, timezone: TZ, recurrence: {} };
const openDraft = scheduleToDraft(open, TODAY, TZ);
assert.equal(presetOf(openDraft), "continuous");
assert.equal(openDraft.endDate, "");
assert.deepEqual(roundTrip(open), open);
assert.equal(presetOf(applyPreset(openDraft, "weekdays", TODAY)), "weekdays");
// A same-day Continuous (14:00-18:00) is the same stored data as One-time and reads back as One-time.
const sameDay: PublicationSchedule = { starts_at: "2026-10-03T07:00:00Z", ends_at: "2026-10-03T11:00:00Z", timezone: TZ, recurrence: {} };
assert.equal(presetOf(scheduleToDraft(sameDay, TODAY, TZ)), "one-time");
// An end at exactly 00:00 does not air on that day.
assert.equal(
  upcomingDays({ ...continuousDraft, endDate: "2026-10-05", endTime: "00:00" }, "2026-10-01", 5).includes("2026-10-05"),
  false,
);

// Validation and preview.
assert.ok(validateDraft({ ...weeklyDraft, days: [] }, TODAY).days);
assert.ok(validateDraft({ ...weeklyDraft, dailyStart: "10:00", dailyEnd: "06:00" }, TODAY).time);
assert.ok(validateDraft({ ...weeklyDraft, endDate: "2026-09-01" }, TODAY).endDate);
assert.ok(validateDraft({ ...weeklyDraft, mode: "dates", dates: [] }, TODAY).dates);
assert.deepEqual(validateDraft(weeklyDraft, TODAY), {});
// Nothing left to air: a past one-time day, only past custom dates, or a range that already ended.
assert.ok(validateDraft({ ...weeklyDraft, mode: "one-time", startDate: "2026-09-24" }, TODAY).startDate);
assert.ok(validateDraft({ ...weeklyDraft, mode: "dates", dates: ["2026-09-24"] }, TODAY).dates);
assert.deepEqual(validateDraft({ ...weeklyDraft, mode: "dates", dates: ["2026-09-24", "2026-10-05"] }, TODAY), {});
assert.ok(validateDraft({ ...weeklyDraft, startDate: "2026-09-01", endDate: "2026-09-20" }, TODAY).endDate);
assert.deepEqual(validateDraft({ ...weeklyDraft, startDate: "2026-09-01" }, TODAY), {}, "a weekly start in the past is fine");
assert.deepEqual(upcomingDays(weeklyDraft, TODAY, 3), ["2026-10-01", "2026-10-02", "2026-10-05"]);
assert.equal(windowLabel(weeklyDraft), "06:00 – 10:00 (4 hours)");

console.log("schedule-preset: ok");
