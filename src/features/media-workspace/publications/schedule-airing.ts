import { DEFAULT_TIMEZONE, END_OF_DAY, formatDmy, formatMonthDays, shiftYmd, utcToZonedParts, ymdDow } from "./schedule.ts";
import type { PublicationSchedule, Recurrence } from "./types/index.ts";

// When a stored Schedule airs, when it ends, how it is described (ADR 0128). Every function takes the wire
// shape Core and the Player evaluate; a Draft enters through `toStoredSchedule` in schedule-preset.ts.

/** The summary lines of a stored schedule; every screen that prints one uses this (ADR 0082 §7). */
export type ScheduleSummary = { title: string; hours: string; range: string; days: number[] };

/**
 * Last local day a schedule can air, "YYYY-MM-DD", or null when open-ended. `ends_at` of an all-day
 * schedule is the midnight after its last day, so an end at exactly 00:00 reads back a day earlier; a
 * one-off's last day is its end date, or the day before when it ends at 00:00. A custom-dates schedule
 * ends on its last date. `airsOn` relies on this.
 */
export function lastAiringDay(schedule: PublicationSchedule): string | null {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const rule = schedule.recurrence;
  if ("freq" in rule && rule.freq === "dates") return [...rule.dates].sort().at(-1) ?? null;
  if (!schedule.ends_at) return null;
  const end = utcToZonedParts(schedule.ends_at, zone);
  return end.time === "00:00" ? shiftYmd(end.date, -1) : end.date;
}

export function describeSchedule(schedule: PublicationSchedule): ScheduleSummary {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const rule = schedule.recurrence;

  if (!("freq" in rule)) {
    const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
    // A one-off ending at the next midnight is the all-day one-time shape.
    if (end && start.time === "00:00" && end.time === "00:00" && end.date === shiftYmd(start.date, 1)) {
      return { title: "One time", hours: "All day", range: formatDmy(start.date), days: [] };
    }
    const from = `${formatDmy(start.date)} ${start.time}`;
    // Same split as scheduleToDraft (ADR 0082 §4): a one-off ending on its start day is one-time.
    const title = end?.date === start.date ? "One time" : "Continuous";
    return { title, hours: "", range: end ? `${from} – ${formatDmy(end.date)} ${end.time}` : `From ${from} · No end date`, days: [] };
  }

  const last = lastAiringDay(schedule);
  const hours = `${rule.daily_start} – ${rule.daily_end}`;
  const range = last
    ? (last === start.date ? formatDmy(start.date) : `${formatDmy(start.date)} – ${formatDmy(last)}`)
    : `From ${formatDmy(start.date)} · No end date`;
  if (rule.freq === "weekly") return { title: rule.days.length === 7 ? "Every day" : "Weekly", hours, range, days: rule.days };
  if (rule.freq === "dates") {
    const count = rule.dates.length;
    return { title: `${count} custom date${count === 1 ? "" : "s"}`, hours, range, days: [] };
  }
  return { title: formatMonthDays(rule.month_days), hours, range, days: [] };
}

/** The first and last moment of a stored schedule plus the time window drawn on a day timeline (Review step). */
export type ScheduleEdges = {
  startDate: string;
  startTime: string;
  /** Inclusive last day; null = no end. */
  endDate: string | null;
  endTime: string | null;
  windowStart: string;
  windowEnd: string;
};

export function scheduleEdges(schedule: PublicationSchedule): ScheduleEdges {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const rule = schedule.recurrence;
  if ("freq" in rule) {
    return {
      startDate: start.date,
      startTime: rule.daily_start,
      endDate: lastAiringDay(schedule),
      endTime: lastAiringDay(schedule) ? rule.daily_end : null,
      windowStart: rule.daily_start,
      windowEnd: rule.daily_end,
    };
  }
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
  const sameDay = end?.date === start.date;
  // Only the all-day one-time shape (midnight to next midnight) reads back as its own day until 23:59;
  // any other one-off shows the end moment as entered, like describeSchedule.
  const isAllDayOneTime = !!end && start.time === "00:00" && end.time === "00:00" && end.date === shiftYmd(start.date, 1);
  return {
    startDate: start.date,
    startTime: start.time,
    endDate: end ? (isAllDayOneTime ? start.date : end.date) : null,
    endTime: end ? (isAllDayOneTime ? END_OF_DAY : end.time) : null,
    windowStart: start.time,
    windowEnd: sameDay && end ? end.time : "24:00",
  };
}

const LOOKAHEAD_DAYS = 366;

/** A Schedule read once: zone, first and last local day, and a string-only "airs on this day" test. */
type Resolved = {
  rule: Recurrence;
  zone: string;
  startDay: string;
  lastDay: string | null;
  matches: (ymd: string) => boolean;
};

/** Day-of-month for a pure "YYYY-MM-DD". A month without that day simply never matches. */
const ymdDay = (ymd: string) => Number(ymd.slice(8, 10));

// Each zone read builds an Intl.DateTimeFormat, so it happens here, once per exported call, never per day.
function resolve(schedule: PublicationSchedule): Resolved {
  const zone = schedule.timezone || DEFAULT_TIMEZONE;
  const startDay = utcToZonedParts(schedule.starts_at, zone).date;
  const lastDay = lastAiringDay(schedule);
  const rule = schedule.recurrence;
  const inRange = (ymd: string) => startDay <= ymd && (lastDay === null || ymd <= lastDay);
  let matches = inRange;
  if ("freq" in rule) {
    if (rule.freq === "dates") matches = (ymd) => rule.dates.includes(ymd);
    else if (rule.freq === "monthly") matches = (ymd) => inRange(ymd) && rule.month_days.includes(ymdDay(ymd));
    else matches = (ymd) => inRange(ymd) && rule.days.includes(ymdDow(ymd));
  }
  return { rule, zone, startDay, lastDay, matches };
}

function upcoming(resolved: Resolved, from: string, limit: number): string[] {
  const { rule } = resolved;
  if ("freq" in rule && rule.freq === "dates") return [...rule.dates].sort().filter((d) => d >= from).slice(0, limit);
  const days: string[] = [];
  for (let i = 0; i <= LOOKAHEAD_DAYS && days.length < limit; i++) {
    const ymd = shiftYmd(from, i);
    if (resolved.matches(ymd)) days.push(ymd);
  }
  return days;
}

/** Does the schedule air on this local day? Day granularity: the daily window is not read. */
export function airsOn(schedule: PublicationSchedule, ymd: string): boolean {
  return resolve(schedule).matches(ymd);
}

/** The next `limit` airing days from `from`, looking at most a year ahead. */
export function upcomingDays(schedule: PublicationSchedule, from: string, limit: number): string[] {
  return upcoming(resolve(schedule), from, limit);
}

/** Does any airing window remain after `now`? A one-off stops at its stored end; the 23:59 rule is for recurrences. */
export function hasAiringLeft(schedule: PublicationSchedule, now: Date = new Date()): boolean {
  const resolved = resolve(schedule);
  const { rule } = resolved;
  if (!("freq" in rule)) return schedule.ends_at === null || Date.parse(schedule.ends_at) > now.getTime();
  const { date: today, time: nowTime } = utcToZonedParts(now.toISOString(), resolved.zone);
  const from = rule.daily_end === END_OF_DAY || rule.daily_end > nowTime ? today : shiftYmd(today, 1);
  return upcoming(resolved, from > resolved.startDay ? from : resolved.startDay, 1).length > 0;
}

/**
 * The local date and time at which the last airing window that actually happens ends, or null when the
 * schedule has no end or never airs. A range may end on a day that does not air (a Mon–Fri range ending on
 * a Sunday), so the last matching day is found by scanning back. `time` is the daily end as stored.
 */
export function lastAiring(schedule: PublicationSchedule): { date: string; time: string } | null {
  const resolved = resolve(schedule);
  const { rule, lastDay, startDay } = resolved;
  if (!("freq" in rule)) {
    const { endDate, endTime } = scheduleEdges(schedule);
    return endDate && endTime ? { date: endDate, time: endTime } : null;
  }
  if (!lastDay) return null;
  for (let i = 0; i <= LOOKAHEAD_DAYS; i++) {
    const day = shiftYmd(lastDay, -i);
    if (day < startDay) break;
    if (resolved.matches(day)) return { date: day, time: rule.daily_end };
  }
  return null;
}
