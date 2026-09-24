/**
 * Runnable check for the airing classifier:
 *
 *     node src/features/publications/schedule.check.mts
 *
 * ponytail: node:assert plus Node's native TS stripping, so this repo needs no
 * test runner. If vitest ever lands, rename to *.test.ts and wrap in it()/expect().
 *
 * Nothing imports this file, so it never reaches a bundle. `.mts` marks it ESM;
 * Node still warns about the typeless package.json when it loads schedule.ts,
 * which is cosmetic — adding "type": "module" would break the Next build.
 */
import assert from "node:assert/strict";
// Explicit .ts extension: Node's ESM resolver does no extension guessing. Needs
// allowImportingTsExtensions in tsconfig, which is safe here (noEmit).
import {
  buildCalendarMonth,
  classifyPublicationAiring,
  getDayTimelinePlacement,
  formatReviewTimeRange,
  formatScheduleStart,
  isScheduleFormValid,
  makeDefaultScheduleForm,
  scheduleFormToPayload,
  scheduleToForm,
  validateScheduleForm,
} from "./schedule.ts";
import type { PublicationSchedule, ScheduleForm } from "./types/index.ts";

// 2026-07-29 is a Wednesday, 2026-08-02 a Sunday. Asia/Bangkok is UTC+7 year round.
const at = (iso: string) => new Date(iso);

const weekly: PublicationSchedule = {
  starts_at: "2026-07-01T00:00:00.000Z",
  ends_at: "2026-12-31T00:00:00.000Z",
  timezone: "Asia/Bangkok",
  recurrence: { freq: "weekly", days: [1, 2, 3, 4, 5], daily_start: "08:00", daily_end: "17:00" },
};

// The whole point of time-of-day granularity: inside the overall window, but off air.
assert.equal(classifyPublicationAiring(weekly, at("2026-07-29T05:00:00Z")), "live"); // Wed 12:00
assert.equal(classifyPublicationAiring(weekly, at("2026-07-29T15:00:00Z")), "next"); // Wed 22:00
assert.equal(classifyPublicationAiring(weekly, at("2026-07-29T00:59:00Z")), "next"); // Wed 07:59
assert.equal(classifyPublicationAiring(weekly, at("2026-08-02T05:00:00Z")), "next"); // Sun 12:00

const overnight: PublicationSchedule = {
  ...weekly,
  recurrence: { freq: "weekly", days: [3], daily_start: "22:00", daily_end: "02:00" },
};
assert.equal(classifyPublicationAiring(overnight, at("2026-07-29T16:00:00Z")), "live"); // Wed 23:00
assert.equal(classifyPublicationAiring(overnight, at("2026-07-29T05:00:00Z")), "next"); // Wed 12:00

const oneOff: PublicationSchedule = {
  starts_at: "2026-07-29T05:00:00.000Z",
  ends_at: null,
  timezone: "Asia/Bangkok",
  recurrence: {},
};
assert.equal(classifyPublicationAiring(oneOff, at("2026-07-29T04:00:00Z")), "next");
assert.equal(classifyPublicationAiring(oneOff, at("2026-07-29T06:00:00Z")), "live");

// status stays 'active' in the backend forever, so "ended" is the card's own filter.
const finished: PublicationSchedule = {
  starts_at: "2026-07-01T00:00:00.000Z",
  ends_at: "2026-07-10T00:00:00.000Z",
  timezone: "Asia/Bangkok",
  recurrence: {},
};
assert.equal(classifyPublicationAiring(finished, at("2026-07-29T05:00:00Z")), "ended");

// Unknown must stay unknown — never guessed into a bucket.
assert.equal(classifyPublicationAiring(null), null);
assert.equal(classifyPublicationAiring(undefined), null);
assert.equal(classifyPublicationAiring({ ...oneOff, starts_at: "not a date" }), null);

assert.equal(formatScheduleStart(weekly, at("2026-07-29T05:00:00Z")), "08:00–17:00");
assert.equal(formatScheduleStart(oneOff, at("2026-07-29T05:00:00Z")), "วันนี้ 12:00");
assert.equal(formatScheduleStart(oneOff, at("2026-07-28T05:00:00Z")), "พรุ่งนี้ 12:00");
assert.equal(formatScheduleStart(oneOff, at("2026-07-30T05:00:00Z")), "เมื่อวาน 12:00");
assert.equal(formatScheduleStart(null), "—");

// --- isScheduleFormValid: this is the Next-gate for wizard step 4 ---
const base: ScheduleForm = makeDefaultScheduleForm();

// "now" needs nothing beyond the auto-filled current time.
assert.equal(isScheduleFormValid({ ...base, schedule_type: "now" }), true);

// "later" requires a start, but expiration stays optional.
assert.equal(
  isScheduleFormValid({ ...base, schedule_type: "later", start_date: "", start_time: "" }),
  false,
);
assert.equal(
  isScheduleFormValid({ ...base, schedule_type: "later", start_date: "2026-08-10", start_time: "09:00" }),
  true,
);

// "range" requires an end strictly after the start — equal or reversed must fail.
const rangeBase: ScheduleForm = {
  ...base,
  schedule_type: "range",
  start_date: "2026-08-10",
  start_time: "09:00",
};
assert.equal(isScheduleFormValid({ ...rangeBase, end_date: "", end_time: "" }), false);
assert.equal(isScheduleFormValid({ ...rangeBase, end_date: "2026-08-10", end_time: "09:00" }), false); // equal
assert.equal(isScheduleFormValid({ ...rangeBase, end_date: "2026-08-09", end_time: "23:00" }), false); // before
assert.equal(isScheduleFormValid({ ...rangeBase, end_date: "2026-08-10", end_time: "09:01" }), true);

// "recurring" additionally needs at least one day and a daily window where start < end.
const recurringBase: ScheduleForm = {
  ...rangeBase,
  schedule_type: "recurring",
  end_date: "2026-12-31",
  end_time: "00:00",
  days: [1, 3, 5],
  daily_start: "08:00",
  daily_end: "17:00",
};

// Review must show a publication's actual expiry; daily_start/end only apply
// to a recurring schedule.
assert.equal(
  formatReviewTimeRange({ ...base, schedule_type: "now", end_date: "2026-09-16", end_time: "16:30" }, "10:15"),
  "10:15 – 16:30",
);
assert.equal(
  formatReviewTimeRange({ ...rangeBase, end_date: "2026-08-10", end_time: "18:00" }, "09:00"),
  "09:00 – 18:00",
);
assert.equal(formatReviewTimeRange(recurringBase, "09:00"), "08:00 – 17:00");
assert.deepEqual(getDayTimelinePlacement("16:00", "19:00"), {
  leftPercent: 66.6667,
  widthPercent: 12.5,
});
assert.deepEqual(getDayTimelinePlacement("22:00", "02:00"), {
  leftPercent: 91.6667,
  widthPercent: 8.3333,
});
assert.equal(isScheduleFormValid(recurringBase), true);
assert.equal(isScheduleFormValid({ ...recurringBase, days: [] }), false);
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "", daily_end: "" }), false);
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "17:00", daily_end: "08:00" }), false); // reversed
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "08:00", daily_end: "08:00" }), false); // equal

// --- validateScheduleForm: which field each failure lands on ---

// "now" is unconditionally clean.
assert.deepEqual(validateScheduleForm({ ...base, schedule_type: "now" }), {});

// A missing start reports both start fields and stops there — no end-date noise.
assert.deepEqual(
  validateScheduleForm({ ...rangeBase, start_date: "", start_time: "", end_date: "", end_time: "" }),
  { start_date: "เลือกวันที่เริ่ม", start_time: "เลือกเวลาเริ่ม" },
);

// Missing end lands on the end fields, one message each.
assert.deepEqual(validateScheduleForm({ ...rangeBase, end_date: "", end_time: "" }), {
  end_date: "เลือกวันที่สิ้นสุด",
  end_time: "เลือกเวลาสิ้นสุด",
});

// An end that is not after the start lands on end_date alone.
assert.deepEqual(
  validateScheduleForm({ ...rangeBase, end_date: "2026-08-10", end_time: "09:00" }),
  { end_date: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" },
);

// Recurring: no weekday selected reports under Repeat On only.
assert.deepEqual(validateScheduleForm({ ...recurringBase, days: [] }), {
  days: "เลือกวันในสัปดาห์อย่างน้อย 1 วัน",
});

// Recurring: an empty daily window reports on both daily fields at once…
assert.deepEqual(
  validateScheduleForm({ ...recurringBase, daily_start: "", daily_end: "" }),
  { daily_start: "กำหนดช่วงเวลารายวัน", daily_end: "กำหนดช่วงเวลารายวัน" },
);

// …and a reversed one lands on the end of the window.
assert.deepEqual(
  validateScheduleForm({ ...recurringBase, daily_start: "17:00", daily_end: "08:00" }),
  { daily_end: "เวลาจบรายวันต้องอยู่หลังเวลาเริ่ม" },
);

// Recurring can report a missing weekday and a bad daily window together.
assert.deepEqual(
  validateScheduleForm({ ...recurringBase, days: [], daily_start: "17:00", daily_end: "08:00" }),
  { days: "เลือกวันในสัปดาห์อย่างน้อย 1 วัน", daily_end: "เวลาจบรายวันต้องอยู่หลังเวลาเริ่ม" },
);

// A fully valid recurring form has no errors at all.
assert.deepEqual(validateScheduleForm(recurringBase), {});

// --- monthly recurrence (Thunder_Core ADR 0012) ---
const monthly: PublicationSchedule = {
  starts_at: "2026-01-01T00:00:00.000Z",
  ends_at: null,
  timezone: "Asia/Bangkok",
  recurrence: { freq: "monthly", month_days: [19, 31], daily_start: "08:00", daily_end: "22:00" },
};
assert.equal(classifyPublicationAiring(monthly, at("2026-10-19T03:00:00Z")), "live"); // 19th 10:00
assert.equal(classifyPublicationAiring(monthly, at("2026-10-20T03:00:00Z")), "next"); // 20th
assert.equal(classifyPublicationAiring(monthly, at("2026-10-19T15:00:00Z")), "next"); // 19th 22:00, end exclusive
// Timezone: 18th 18:00Z is the 19th 01:00 in Bangkok (before the window), 18th 23:30Z is 06:30...
assert.equal(classifyPublicationAiring(monthly, at("2026-10-18T18:00:00Z")), "next");
// ...and 19th 01:00Z is 08:00 Bangkok: on air, although UTC still says the 19th only by an hour.
assert.equal(classifyPublicationAiring(monthly, at("2026-10-19T01:00:00Z")), "live");
// Same instant, schedule in UTC: it is the 18th there, so not an air day.
assert.equal(classifyPublicationAiring({ ...monthly, timezone: "UTC" }, at("2026-10-18T18:00:00Z")), "next");

// Resume round-trip keeps monthly intact — the bug it guards: a monthly draft reopened in the
// wizard used to come back as a "range" and save as "plays every day".
const monthlyForm = scheduleToForm(monthly);
assert.equal(monthlyForm.schedule_type, "monthly");
assert.deepEqual(monthlyForm.month_days, [19, 31]);
assert.deepEqual(validateScheduleForm(monthlyForm), {});
assert.deepEqual(scheduleFormToPayload(monthlyForm).recurrence, monthly.recurrence);
assert.equal(scheduleFormToPayload(monthlyForm).starts_at, monthly.starts_at);
assert.equal(validateScheduleForm({ ...monthlyForm, month_days: [] }).month_days !== undefined, true);
// Weekly resume is unchanged.
assert.equal(scheduleToForm(weekly).schedule_type, "recurring");
assert.deepEqual(scheduleFormToPayload(scheduleToForm(weekly)).recurrence, weekly.recurrence);

// Calendar: [19, 31] in a 30-day month skips the 31st (no roll-over to the 30th).
const nov = buildCalendarMonth(monthlyForm, [], 2026, 10).flat().filter((d) => d.isActive).map((d) => d.day);
assert.deepEqual(nov, [19]);
const dec = buildCalendarMonth(monthlyForm, [], 2026, 11).flat().filter((d) => d.isActive).map((d) => d.day);
assert.deepEqual(dec, [19, 31]);
// February of a non-leap year has neither.
const feb29: ScheduleForm = { ...monthlyForm, month_days: [29] };
assert.deepEqual(buildCalendarMonth(feb29, [], 2027, 1).flat().filter((d) => d.isActive).length, 0);
assert.deepEqual(buildCalendarMonth(feb29, [], 2028, 1).flat().filter((d) => d.isActive).map((d) => d.day), [29]);

assert.equal(formatReviewTimeRange(monthlyForm, "10:00"), "08:00 – 22:00");

console.log("schedule.check.mts — all assertions passed");
