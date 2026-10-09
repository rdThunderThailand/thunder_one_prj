import { DEFAULT_TIMEZONE, shiftYmd, utcToZonedParts, ymdDow, zonedToUtcIso } from "./schedule.ts";
import type { PublicationSchedule } from "./types/index.ts";

/**
 * Edit Schedule modal (frames 08-12, plan §2 FE-E): the operator's view of a schedule as presets,
 * mapped both ways to the stored shape. Presets are never stored — the highlight is derived.
 */

export type SchedulePreset =
  | "everyday"
  | "weekdays"
  | "weekends"
  | "custom-days"
  | "date-range"
  | "monthly"
  | "one-time"
  | "continuous";

/**
 * `weekly` also carries Every day / Weekdays / Weekends / Date range (7 days + an end date) and `monthly`
 * shares its start / end / daily window. `one-time` and `continuous` are both the stored one-off `{}`
 * (ADR 0082 §4): one-time is a single day with a daily window; continuous runs from a start moment to an
 * optional end moment with no daily window.
 */
export type ScheduleDraft = {
  mode: "weekly" | "dates" | "monthly" | "one-time" | "continuous";
  days: number[];
  dates: string[];
  /** Monthly: days of the month, 1-31. A month without a chosen day is skipped. */
  monthDays: number[];
  /** "YYYY-MM-DD" in `timezone`. Weekly / monthly: first day it may air. One-time: the day. Continuous: the start day. */
  startDate: string;
  /** Weekly / monthly: last day, inclusive. Continuous: the end day. "" = no end. */
  endDate: string;
  dailyStart: string;
  dailyEnd: string;
  allDay: boolean;
  /** Continuous only: clock times of the start and end moments. */
  startTime: string;
  endTime: string;
  timezone: string;
};

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAY_SET = [1, 2, 3, 4, 5];
const WEEKEND_SET = [0, 6];
export const MAX_DATES = 366;

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && b.every((v) => a.includes(v));

/** Right now in `timezone`: `date` "YYYY-MM-DD", `time` "HH:MM". */
export const nowIn = (timezone: string) => utcToZonedParts(new Date().toISOString(), timezone);

/** "YYYY-MM-DD" of right now in `timezone`. */
export const todayIn = (timezone: string) => nowIn(timezone).date;

/** A new Program: Every day, from today, all day, no end (ADR 0082 §5). Airs from activation. */
export function defaultScheduleDraft(today: string = todayIn(DEFAULT_TIMEZONE), timezone: string = DEFAULT_TIMEZONE): ScheduleDraft {
  return { ...applyPreset(scheduleToDraft(null, today, timezone), "everyday", today), allDay: true };
}

export function presetOf(draft: ScheduleDraft): SchedulePreset | null {
  if (draft.mode === "dates") return "custom-days";
  if (draft.mode === "monthly") return "monthly";
  if (draft.mode === "one-time") return "one-time";
  if (draft.mode === "continuous") return "continuous";
  if (sameSet(draft.days, ALL_DAYS)) return draft.endDate ? "date-range" : "everyday";
  if (sameSet(draft.days, WEEKDAY_SET)) return "weekdays";
  if (sameSet(draft.days, WEEKEND_SET)) return "weekends";
  return null;
}

export function applyPreset(draft: ScheduleDraft, preset: SchedulePreset, today: string): ScheduleDraft {
  const startDate = draft.startDate || today;
  const base = { ...draft, startDate };
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
    case "monthly":
      return { ...base, mode: "monthly", monthDays: draft.monthDays.length > 0 ? draft.monthDays : [Number(startDate.slice(8))] };
    case "one-time":
      return { ...base, mode: "one-time", endDate: "" };
    case "continuous":
      return { ...base, mode: "continuous", endDate: "" };
  }
}

export function scheduleToDraft(schedule: PublicationSchedule | null, today: string, timezone: string): ScheduleDraft {
  const empty: ScheduleDraft = {
    mode: "weekly",
    days: ALL_DAYS,
    dates: [],
    monthDays: [],
    startDate: today,
    endDate: "",
    dailyStart: "09:00",
    dailyEnd: "18:00",
    allDay: false,
    startTime: "00:00",
    endTime: "00:00",
    timezone,
  };
  if (!schedule) return empty;

  const zone = schedule.timezone || timezone;
  const start = utcToZonedParts(schedule.starts_at, zone);
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, zone) : null;
  const rec = schedule.recurrence;
  // draftToSchedule stores the end as the midnight after the last day; read it back inclusively.
  const inclusiveEnd = () => (end ? (end.time === "00:00" ? shiftYmd(end.date, -1) : end.date) : "");
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
    return {
      ...withWindow("00:00", "23:59"),
      mode: "continuous",
      startTime: start.time,
      endDate: end?.date ?? "",
      endTime: end?.time ?? "00:00",
    };
  }
  if (rec.freq === "monthly") {
    return { ...withWindow(rec.daily_start, rec.daily_end), mode: "monthly", monthDays: [...rec.month_days], endDate: inclusiveEnd() };
  }
  if (rec.freq === "dates") {
    return { ...withWindow(rec.daily_start, rec.daily_end), mode: "dates", dates: [...rec.dates] };
  }
  return { ...withWindow(rec.daily_start, rec.daily_end), mode: "weekly", days: [...rec.days], endDate: inclusiveEnd() };
}

export type DraftErrors = Partial<Record<"days" | "dates" | "monthDays" | "startDate" | "endDate" | "time", string>>;

const PAST_START = "Start date can't be in the past.";

function validateContinuous(draft: ScheduleDraft, today: string, nowTime: string, isStartLocked: boolean): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.startDate) errors.startDate = "Pick a start date.";
  else if (!isStartLocked && draft.startDate < today) errors.startDate = PAST_START;
  if (!draft.endDate) return errors;
  const startKey = `${draft.startDate} ${draft.startTime}`;
  const endKey = `${draft.endDate} ${draft.endTime}`;
  if (endKey <= startKey) errors.endDate = "End must be after the start.";
  else if (endKey <= `${today} ${nowTime}`) errors.endDate = "End is in the past.";
  return errors;
}

/**
 * `today` ("YYYY-MM-DD" in the draft's zone) rejects a schedule that could never air again;
 * `nowTime` ("HH:MM", same zone) also catches an end earlier today (#222). A start before today is
 * rejected unless `isStartLocked` — a Live Program keeps its past start and edits only its end (ADR 0090).
 */
export function validateDraft(draft: ScheduleDraft, today: string, nowTime = "00:00", isStartLocked = false): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.mode === "continuous") return validateContinuous(draft, today, nowTime, isStartLocked);
  if (!draft.allDay && !(draft.dailyStart < draft.dailyEnd)) errors.time = "End time must be after start time.";
  if (draft.mode === "weekly" || draft.mode === "monthly") {
    if (draft.mode === "weekly" && draft.days.length === 0) errors.days = "Pick at least one day.";
    if (draft.mode === "monthly" && draft.monthDays.length === 0) errors.monthDays = "Pick at least one day of the month.";
    if (!draft.startDate) errors.startDate = "Pick a start date.";
    else if (!isStartLocked && draft.startDate < today) errors.startDate = PAST_START;
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
  else if (draft.mode === "one-time" && draft.startDate === today && !draft.allDay && draft.dailyEnd <= nowTime) {
    errors.time = "This time has already passed today.";
  }
  return errors;
}

/** `validateDraft` against the current moment in the draft's own zone. */
export function validateDraftNow(draft: ScheduleDraft, isStartLocked = false): DraftErrors {
  const now = nowIn(draft.timezone);
  return validateDraft(draft, now.date, now.time, isStartLocked);
}

export const isDraftValid = (draft: ScheduleDraft) => Object.keys(validateDraftNow(draft)).length === 0;

function dailyWindow(draft: ScheduleDraft): { start: string; end: string } {
  return draft.allDay ? { start: "00:00", end: "23:59" } : { start: draft.dailyStart, end: draft.dailyEnd };
}

/** The stored shape. Call only on a draft with no `validateDraft` errors. */
export function draftToSchedule(draft: ScheduleDraft): PublicationSchedule {
  if (draft.mode === "continuous") {
    return {
      starts_at: zonedToUtcIso(draft.startDate, draft.startTime, draft.timezone),
      ends_at: draft.endDate ? zonedToUtcIso(draft.endDate, draft.endTime, draft.timezone) : null,
      timezone: draft.timezone,
      recurrence: {},
    };
  }
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
  const range = {
    starts_at: zonedToUtcIso(draft.startDate, "00:00", zone),
    ends_at: draft.endDate ? zonedToUtcIso(shiftYmd(draft.endDate, 1), "00:00", zone) : null,
    timezone: zone,
  };
  if (draft.mode === "monthly") {
    const monthDays = [...new Set(draft.monthDays)].sort((a, b) => a - b);
    return { ...range, recurrence: { freq: "monthly", month_days: monthDays, daily_start: start, daily_end: end } };
  }
  return {
    ...range,
    recurrence: { freq: "weekly", days: [...draft.days].sort((a, b) => a - b), daily_start: start, daily_end: end },
  };
}

/** Does the draft air on this local day? Drives the preview list and week grid. */
export function airsOn(draft: ScheduleDraft, ymd: string): boolean {
  if (draft.mode === "one-time") return ymd === draft.startDate;
  if (draft.mode === "dates") return draft.dates.includes(ymd);
  if (draft.mode === "continuous") {
    if (ymd < draft.startDate) return false;
    // An end at exactly 00:00 closes before that day starts.
    return !draft.endDate || ymd < draft.endDate || (ymd === draft.endDate && draft.endTime !== "00:00");
  }
  if (ymd < draft.startDate || (draft.endDate && ymd > draft.endDate)) return false;
  if (draft.mode === "monthly") return draft.monthDays.includes(Number(ymd.slice(8)));
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
