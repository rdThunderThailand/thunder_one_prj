import { DEFAULT_TIMEZONE, formatDmy, formatMonthDays, shiftYmd, utcToZonedParts } from "./schedule.ts";
import type { PublicationSchedule } from "./types/index.ts";

/** The summary lines of a stored schedule; every screen that prints one uses this (ADR 0082 §7). */
export type ScheduleSummary = { title: string; hours: string; range: string; days: number[] };

/**
 * Last local day a recurring schedule can air, "YYYY-MM-DD", or null when open-ended. `ends_at` of an
 * all-day recurring schedule is the midnight after its last day, so that midnight reads back a day earlier.
 * A one-off keeps its own end moment (its times are part of the summary), so it is not covered here.
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
    endTime: end ? (isAllDayOneTime ? "23:59" : end.time) : null,
    windowStart: start.time,
    windowEnd: sameDay && end ? end.time : "24:00",
  };
}
