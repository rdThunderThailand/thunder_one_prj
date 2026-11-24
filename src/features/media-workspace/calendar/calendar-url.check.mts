/**
 * Runnable check for the Calendar URL round-trip:
 *
 *     node src/features/media-workspace/calendar/calendar-url.check.mts
 */
import assert from "node:assert/strict";
import { readCalendarUrl, writeCalendarUrl } from "./calendar-url.ts";

const TODAY = "2026-10-06";
const p = (qs: string) => new URLSearchParams(qs);

assert.deepEqual(readCalendarUrl(p(""), TODAY), { date: TODAY, scope: { kind: "all" } });
assert.equal(readCalendarUrl(p("date=2026-10-09"), TODAY).date, "2026-10-09");
for (const bad of ["tomorrow", "2026-13-01", "2026-02-30", "26-10-09", ""]) {
  assert.equal(readCalendarUrl(p(`date=${bad}`), TODAY).date, TODAY, bad);
}
assert.deepEqual(readCalendarUrl(p("date=2026-10-09&group=g1"), TODAY), {
  date: "2026-10-09",
  scope: { kind: "group", id: "g1" },
});

assert.equal(writeCalendarUrl({ date: TODAY, scope: { kind: "all" } }, TODAY).toString(), "");
assert.equal(writeCalendarUrl({ date: "2026-10-09", scope: { kind: "channel", id: "c1" } }, TODAY).toString(), "channel=c1&date=2026-10-09");

const state = { date: "2026-10-09", scope: { kind: "group", id: "g1" } } as const;
assert.deepEqual(readCalendarUrl(writeCalendarUrl(state, TODAY), TODAY), state);

console.log("calendar-url: ok");
