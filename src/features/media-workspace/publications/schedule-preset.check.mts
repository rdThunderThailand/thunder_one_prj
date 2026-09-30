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

// Monthly and open-ended one-offs are kept verbatim until a preset is picked.
const monthly: PublicationSchedule = { ...weekly, recurrence: { freq: "monthly", month_days: [1, 15], daily_start: "08:00", daily_end: "09:00" } };
const monthlyDraft = scheduleToDraft(monthly, TODAY, TZ);
assert.equal(monthlyDraft.locked?.kind, "monthly");
assert.equal(presetOf(monthlyDraft), null);
assert.equal(draftToSchedule(monthlyDraft), monthly);
assert.deepEqual(upcomingDays(monthlyDraft, TODAY, 2), ["2026-10-01", "2026-10-15"]);
const open: PublicationSchedule = { starts_at: "2026-09-30T02:00:00Z", ends_at: null, timezone: TZ, recurrence: {} };
assert.equal(scheduleToDraft(open, TODAY, TZ).locked?.kind, "continuous");
assert.equal(applyPreset(scheduleToDraft(open, TODAY, TZ), "weekdays", TODAY).locked, null);

// Validation and preview.
assert.ok(validateDraft({ ...weeklyDraft, days: [] }).days);
assert.ok(validateDraft({ ...weeklyDraft, dailyStart: "10:00", dailyEnd: "06:00" }).time);
assert.ok(validateDraft({ ...weeklyDraft, endDate: "2026-09-01" }).endDate);
assert.ok(validateDraft({ ...weeklyDraft, mode: "dates", dates: [] }).dates);
assert.deepEqual(validateDraft(weeklyDraft), {});
assert.deepEqual(upcomingDays(weeklyDraft, TODAY, 3), ["2026-10-01", "2026-10-02", "2026-10-05"]);
assert.equal(windowLabel(weeklyDraft), "06:00 – 10:00 (4 hours)");

console.log("schedule-preset: ok");
