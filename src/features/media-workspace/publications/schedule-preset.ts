import { recurrenceAirsOn, shiftYmd, utcToZonedParts, ymdDow, zonedToUtcIso } from "./schedule.ts";
import type { PublicationSchedule } from "./types/index.ts";

/**
 * Edit Schedule modal (frames 08-12, plan §2 FE-E): the operator's view of a schedule as presets,
 * mapped both ways to the stored shape. Presets are never stored — the highlight is derived.
 */

export type SchedulePreset = "everyday" | "weekdays" | "weekends" | "custom-days" | "date-range" | "one-time";

/**
 * `weekly` also carries Every day / Weekdays / Weekends / Date range (7 days + an end date).
 * `locked` = a stored shape this modal cannot edit (monthly, or a one-off spanning days); it is kept
 * as-is until the operator picks a preset, which overwrites it (plan §2).
 */
export type ScheduleDraft = {
  mode: "weekly" | "dates" | "one-time" | "locked";
  days: number[];
  dates: string[];
  /** "YYYY-MM-DD" in `timezone`. Weekly: first day it may air. One-time: the day. */
  startDate: string;
  /** Weekly only, inclusive; "" = no end date. */
  endDate: string;
  dailyStart: string;
  dailyEnd: string;
  allDay: boolean;
  timezone: string;
  locked: { kind: "monthly" | "continuous"; schedule: PublicationSchedule } | null;
};

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAY_SET = [1, 2, 3, 4, 5];
const WEEKEND_SET = [0, 6];
export const MAX_DATES = 366;

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && b.every((v) => a.includes(v));

export function presetOf(draft: ScheduleDraft): SchedulePreset | null {
  if (draft.mode === "dates") return "custom-days";
  if (draft.mode === "one-time") return "one-time";
  if (draft.mode !== "weekly") return null;
  if (sameSet(draft.days, ALL_DAYS)) return draft.endDate ? "date-range" : "everyday";
  if (sameSet(draft.days, WEEKDAY_SET)) return "weekdays";
  if (sameSet(draft.days, WEEKEND_SET)) return "weekends";
  return null;
}

export function applyPreset(draft: ScheduleDraft, preset: SchedulePreset, today: string): ScheduleDraft {
  const startDate = draft.startDate || today;
  const base = { ...draft, startDate, locked: null };
  switch (preset) {
    case "everyday":
      return { ...base, mode: "weekly", days: ALL_DAYS, endDate: "" };
    case "weekdays":
      return { ...base, mode: "weekly", days: WEEKDAY_SET };
    case "weekends":
      return { ...base, mode: "weekly", days: WEEKEND_SET };
    case "date-range":
      return { ...base, mode: "weekly", days: ALL_DAYS, endDate: draft.endDate || shiftYmd(startDate, 30) };
    case "custom-days":
      return { ...base, mode: "dates" };
    case "one-time":
      return { ...base, mode: "one-time", endDate: "" };
  }
}

export function scheduleToDraft(schedule: PublicationSchedule | null, today: string, timezone: string): ScheduleDraft {
  const empty: ScheduleDraft = {
    mode: "weekly",
    days: ALL_DAYS,
    dates: [],
    startDate: today,
    endDate: "",
    dailyStart: "09:00",
    dailyEnd: "18:00",
    allDay: false,
    timezone,
    locked: null,
  };
  if (!schedule) return empty;

  const zone = schedule.timezone || timezone;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
  const rec = schedule.recurrence;
  const withWindow = (dailyStart: string, dailyEnd: string) => ({
    ...empty,
    timezone: zone,
    startDate: start.date,
    dailyStart,
    dailyEnd,
    allDay: dailyStart === "00:00" && dailyEnd === "23:59",
  });

  if (!("freq" in rec)) {
    if (end && end.date === start.date) return { ...withWindow(start.time, end.time), mode: "one-time" };
    // A one-off ending at the next midnight is the modal's own all-day one-time shape.
    if (end && end.time === "00:00" && end.date === shiftYmd(start.date, 1) && start.time === "00:00") {
      return { ...withWindow("00:00", "23:59"), mode: "one-time" };
    }
    return { ...withWindow("00:00", "23:59"), mode: "locked", locked: { kind: "continuous", schedule } };
  }
  if (rec.freq === "monthly") {
    return { ...withWindow(rec.daily_start, rec.daily_end), mode: "locked", locked: { kind: "monthly", schedule } };
  }
  if (rec.freq === "dates") {
    return { ...withWindow(rec.daily_start, rec.daily_end), mode: "dates", dates: [...rec.dates] };
  }
  // draftToSchedule stores the end as the midnight after the last day; read it back inclusively.
  const endDate = end ? (end.time === "00:00" ? shiftYmd(end.date, -1) : end.date) : "";
  return { ...withWindow(rec.daily_start, rec.daily_end), mode: "weekly", days: [...rec.days], endDate };
}

export type DraftErrors = Partial<Record<"days" | "dates" | "startDate" | "endDate" | "time", string>>;

/** `today` ("YYYY-MM-DD" in the draft's zone) rejects a schedule that could never air again. */
export function validateDraft(draft: ScheduleDraft, today: string): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.mode === "locked") return errors;
  if (!draft.allDay && !(draft.dailyStart < draft.dailyEnd)) errors.time = "End time must be after start time.";
  if (draft.mode === "weekly") {
    if (draft.days.length === 0) errors.days = "Pick at least one day.";
    if (!draft.startDate) errors.startDate = "Pick a start date.";
    if (draft.endDate && draft.endDate < draft.startDate) errors.endDate = "End date must be on or after the start date.";
    else if (draft.endDate && draft.endDate < today) errors.endDate = "End date is in the past.";
  }
  if (draft.mode === "dates") {
    if (draft.dates.length === 0) errors.dates = "Pick at least one date.";
    if (draft.dates.length > MAX_DATES) errors.dates = `Pick at most ${MAX_DATES} dates.`;
    if (draft.dates.length > 0 && draft.dates.every((d) => d < today)) errors.dates = "Pick at least one date from today on.";
  }
  if (draft.mode === "one-time" && !draft.startDate) errors.startDate = "Pick a date.";
  else if (draft.mode === "one-time" && draft.startDate < today) errors.startDate = "Pick today or a later date.";
  return errors;
}

function dailyWindow(draft: ScheduleDraft): { start: string; end: string } {
  return draft.allDay ? { start: "00:00", end: "23:59" } : { start: draft.dailyStart, end: draft.dailyEnd };
}

/** The stored shape. Call only on a draft with no `validateDraft` errors. */
export function draftToSchedule(draft: ScheduleDraft): PublicationSchedule {
  if (draft.mode === "locked" && draft.locked) return draft.locked.schedule;
  const { start, end } = dailyWindow(draft);
  const zone = draft.timezone;
  // All day closes at the next midnight, as Thunder_Core does for 00:00-23:59 (ADR 0014).
  const closeOn = (ymd: string) => (draft.allDay ? zonedToUtcIso(shiftYmd(ymd, 1), "00:00", zone) : zonedToUtcIso(ymd, end, zone));

  if (draft.mode === "one-time") {
    return { starts_at: zonedToUtcIso(draft.startDate, start, zone), ends_at: closeOn(draft.startDate), timezone: zone, recurrence: {} };
  }
  if (draft.mode === "dates") {
    const dates = [...new Set(draft.dates)].sort();
    return {
      starts_at: zonedToUtcIso(dates[0], start, zone),
      ends_at: closeOn(dates[dates.length - 1]),
      timezone: zone,
      recurrence: { freq: "dates", dates, daily_start: start, daily_end: end },
    };
  }
  return {
    starts_at: zonedToUtcIso(draft.startDate, "00:00", zone),
    ends_at: draft.endDate ? zonedToUtcIso(shiftYmd(draft.endDate, 1), "00:00", zone) : null,
    timezone: zone,
    recurrence: { freq: "weekly", days: [...draft.days].sort((a, b) => a - b), daily_start: start, daily_end: end },
  };
}

/** Does the draft air on this local day? Drives the preview list and week grid. */
export function airsOn(draft: ScheduleDraft, ymd: string): boolean {
  if (draft.mode === "one-time") return ymd === draft.startDate;
  if (draft.mode === "dates") return draft.dates.includes(ymd);
  if (draft.mode === "locked" && draft.locked) {
    const { schedule } = draft.locked;
    const zone = schedule.timezone;
    const from = utcToZonedParts(schedule.starts_at, zone).date;
    const to = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone).date : null;
    if (ymd < from || (to && ymd > to)) return false;
    return recurrenceAirsOn(schedule.recurrence, ymd);
  }
  if (ymd < draft.startDate || (draft.endDate && ymd > draft.endDate)) return false;
  return draft.days.includes(ymdDow(ymd));
}

/** Next `limit` airing days from `from`, looking at most a year ahead. */
export function upcomingDays(draft: ScheduleDraft, from: string, limit: number): string[] {
  if (draft.mode === "dates") return [...draft.dates].sort().filter((d) => d >= from).slice(0, limit);
  const days: string[] = [];
  for (let i = 0; i <= MAX_DATES && days.length < limit; i++) {
    const ymd = shiftYmd(from, i);
    if (airsOn(draft, ymd)) days.push(ymd);
  }
  return days;
}

export function windowLabel(draft: ScheduleDraft): string {
  if (draft.allDay) return "All day (00:00 – 24:00)";
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const hours = Math.round(((minutes(draft.dailyEnd) - minutes(draft.dailyStart)) / 60) * 10) / 10;
  const length = `${hours}`;
  return `${draft.dailyStart} – ${draft.dailyEnd} (${length} hour${hours === 1 ? "" : "s"})`;
}
