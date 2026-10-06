/**
 * Runnable check for the Calendar day maths:
 *
 *     node src/features/media-workspace/calendar/calendar-day.check.mts
 */
import assert from "node:assert/strict";
import { blockPosition, defaultBlock, overriddenLanes, clockLabel, dayRange, formatDuration, programAction, initialScrollPercent, isNowBlock, nextBlock, nowPercent, partOf, todayYmd } from "./calendar-day.ts";
import type { CalendarRow, CalendarSegment } from "./calendar-api.ts";

const seg = (opens: string, closes: string, occurrence: CalendarSegment["occurrence"] = null): CalendarSegment => ({
  opens_at: opens,
  closes_at: closes,
  priority: "normal",
  output_kind: "publication",
  publications: [],
  suppressed: [],
  occurrence,
});
const at = (hhmm: string, ymd = "2026-10-06") => `${ymd}T${hhmm}:00+07:00`;

assert.deepEqual(dayRange("2026-10-06"), { from: "2026-10-06T00:00:00+07:00", to: "2026-10-07T00:00:00+07:00" });
assert.deepEqual(dayRange("2026-10-31"), { from: "2026-10-31T00:00:00+07:00", to: "2026-11-01T00:00:00+07:00" });

// 17:00 Bangkok is still the 6th; 17:00 UTC (00:00 on the 7th in Bangkok) is already the 7th.
assert.equal(todayYmd(new Date("2026-10-06T10:00:00Z")), "2026-10-06");
assert.equal(todayYmd(new Date("2026-10-06T17:00:00Z")), "2026-10-07");

assert.deepEqual(blockPosition(seg(at("06:00"), at("12:00")), "2026-10-06"), { left: 25, width: 25 });
// A block that leaks past the day is clamped to the grid.
assert.deepEqual(blockPosition(seg(at("22:00", "2026-10-05"), at("06:00")), "2026-10-06"), { left: 0, width: 25 });

const now = Date.parse(at("10:00"));
assert.equal(nowPercent("2026-10-06", now), (10 / 24) * 100);
assert.equal(nowPercent("2026-10-07", now), null);
assert.equal(isNowBlock(seg(at("09:00"), at("10:00")), now), false); // closes_at is exclusive
assert.equal(isNowBlock(seg(at("10:00"), at("11:00")), now), true);

const first = seg(at("08:00"), at("09:00"));
const later = seg(at("11:00"), at("12:00"));
const soon = seg(at("09:00"), at("10:00"));
const row: CalendarRow = { row_type: "channel", channel: null, device: null, segments: [later, first, soon] };
assert.equal(nextBlock(row, first), soon);
assert.equal(nextBlock(row, later), null);

const airing = seg(at("09:30"), at("10:30"));
const rowOf = (...segments: CalendarSegment[]): CalendarRow => ({ row_type: "channel", channel: null, device: null, segments });
assert.equal(defaultBlock(rowOf(first, airing, later), now), airing); // airs now (10:00)
assert.equal(defaultBlock(rowOf(first, later), now), later); // nothing now: next to start
assert.equal(defaultBlock(rowOf(first), now), first); // all in the past: the last one
assert.equal(defaultBlock(rowOf(), now), null);

assert.equal(partOf(seg(at("08:00"), at("09:00"))), null);
assert.equal(partOf(seg(at("08:00"), at("09:00"), { opens_at: at("08:00"), closes_at: at("09:00") })), null);
const cut = { opens_at: at("08:00"), closes_at: at("11:00") };
assert.equal(partOf(seg(at("08:00"), at("09:00"), cut)), cut);
const open = { opens_at: at("08:00"), closes_at: null };
assert.equal(partOf(seg(at("08:00"), at("09:00"), open)), open);

assert.equal(initialScrollPercent("2026-10-07", now), (8 / 24) * 100);
assert.ok(Math.abs(initialScrollPercent("2026-10-06", now) - (9 / 24) * 100) < 1e-9);

assert.equal(clockLabel(at("09:05"), "2026-10-06"), "09:05");
assert.equal(clockLabel(at("00:00", "2026-10-07"), "2026-10-06"), "24:00");
assert.equal(clockLabel(at("00:00"), "2026-10-06"), "00:00");

assert.equal(formatDuration(25 * 60_000), "25 min");
assert.equal(formatDuration(120 * 60_000), "2 h");
assert.equal(formatDuration(135 * 60_000), "2 h 15 min");

const pub = (ends: string | null) => ({ id: "p1", schedule_ends_at: ends }) as Parameters<typeof programAction>[0];
const back = "/media-workspace/calendar?date=2026-10-09";
assert.deepEqual(programAction(pub(null), back, now), {
  label: "Edit Program",
  href: "/media-workspace/program/p1/edit?returnTo=%2Fmedia-workspace%2Fcalendar%3Fdate%3D2026-10-09",
});
assert.equal(programAction(pub(at("12:00")), back, now).label, "Edit Program");
assert.deepEqual(programAction(pub(at("09:00")), back, now), { label: "View Program", href: "/media-workspace/program/p1" });

// Overridden lanes: spans joined across blocks; touching spans merge and collect every winner.
const win = (name: string) => ({ name }) as CalendarSegment["publications"][number];
const hide = (id: string, priority: CalendarSegment["priority"], spans: Array<[string, string]>) => ({
  id,
  name: id,
  priority,
  spans: spans.map(([opens, closes]) => ({ opens_at: at(opens), closes_at: at(closes) })),
});
const lanes = overriddenLanes(
  rowOf(
    { ...seg(at("09:00"), at("10:00")), publications: [win("B")], suppressed: [hide("low-1", "low", [["09:00", "10:00"]])] },
    { ...seg(at("08:00"), at("09:00")), publications: [win("A")], suppressed: [hide("low-1", "low", [["08:00", "09:00"]]), hide("normal-1", "normal", [["08:30", "09:00"]])] },
    { ...seg(at("11:00"), at("12:00")), publications: [win("C")], suppressed: [hide("low-1", "low", [["11:00", "11:30"]])] },
  ),
);
assert.deepEqual(
  lanes.map((lane) => lane.id),
  ["normal-1", "low-1"],
);
assert.deepEqual(lanes[1].spans, [
  { opens_at: at("08:00"), closes_at: at("10:00"), winners: ["A", "B"] },
  { opens_at: at("11:00"), closes_at: at("11:30"), winners: ["C"] },
]);
assert.deepEqual(overriddenLanes(rowOf(first)), []);
// A Core without the BE-C migration sends no spans: no lanes, no crash.
assert.deepEqual(overriddenLanes(rowOf({ ...first, suppressed: [{ id: "x", name: "x", priority: "low" }] })), []);

console.log("calendar-day: ok");
