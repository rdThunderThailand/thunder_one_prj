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
  classifyPublicationAiring,
  formatScheduleStart,
  isScheduleFormValid,
  makeDefaultScheduleForm,
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
assert.equal(isScheduleFormValid(recurringBase), true);
assert.equal(isScheduleFormValid({ ...recurringBase, days: [] }), false);
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "", daily_end: "" }), false);
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "17:00", daily_end: "08:00" }), false); // reversed
assert.equal(isScheduleFormValid({ ...recurringBase, daily_start: "08:00", daily_end: "08:00" }), false); // equal

console.log("schedule.check.mts — all assertions passed");
