import type {
  PublicationSchedule,
  Recurrence,
  ScheduleForm,
  SchedulePayload,
} from "./types";

export const DEFAULT_TIMEZONE = "Asia/Bangkok";

// ponytail: a short fixed list is enough for a Thailand-first product. The
// helpers below are DST-correct via Intl, so adding a DST zone here needs no
// other change.
export const TIMEZONES = [
  { id: "Asia/Bangkok", label: "(GMT+07:00) Bangkok" },
  { id: "Asia/Jakarta", label: "(GMT+07:00) Jakarta" },
  { id: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { id: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
  { id: "UTC", label: "(GMT+00:00) UTC" },
] as const;

// 0 = Sunday .. 6 = Saturday, matching Postgres EXTRACT(DOW ...).
export const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

// --- timezone-aware date <-> UTC conversion (no dependencies) ----------------

function partsInZone(instant: number, timeZone: string): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const out: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(instant)) out[type] = value;
  return out;
}

function tzOffsetMs(instant: number, timeZone: string): number {
  const p = partsInZone(instant, timeZone);
  const hour = p.hour === "24" ? "00" : p.hour;
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second);
  return asUtc - instant;
}

/** Treat "YYYY-MM-DD" + "HH:MM" as wall-clock in `timeZone`; return a UTC ISO. */
export function zonedToUtcIso(date: string, time: string, timeZone: string): string {
  const naive = Date.parse(`${date}T${time}:00Z`); // wall clock read as if UTC
  // Two passes so a DST transition resolves to the offset at the real instant.
  const offset1 = tzOffsetMs(naive, timeZone);
  const offset2 = tzOffsetMs(naive - offset1, timeZone);
  return new Date(naive - offset2).toISOString();
}

/** Inverse: a UTC ISO -> wall-clock "YYYY-MM-DD" / "HH:MM" in `timeZone`. */
export function utcToZonedParts(iso: string, timeZone: string): { date: string; time: string } {
  const p = partsInZone(Date.parse(iso), timeZone);
  const hour = p.hour === "24" ? "00" : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` };
}

// --- form defaults, validation, and mapping ----------------------------------

export function makeDefaultScheduleForm(): ScheduleForm {
  const now = utcToZonedParts(new Date().toISOString(), DEFAULT_TIMEZONE);
  return {
    schedule_type: "now",
    start_date: now.date,
    start_time: now.time,
    timezone: DEFAULT_TIMEZONE,
    end_date: "",
    end_time: "",
    days: [],
    daily_start: "09:00",
    daily_end: "17:00",
  };
}

export function isScheduleFormValid(form: ScheduleForm): boolean {
  if (form.schedule_type === "now") return true;
  if (!form.start_date || !form.start_time) return false;
  if (form.schedule_type === "later") return true; // expiration is optional

  // range | recurring both require an end strictly after the start
  if (!form.end_date || !form.end_time) return false;
  const start = Date.parse(zonedToUtcIso(form.start_date, form.start_time, form.timezone));
  const end = Date.parse(zonedToUtcIso(form.end_date, form.end_time, form.timezone));
  if (end <= start) return false;

  if (form.schedule_type === "recurring") {
    if (form.days.length === 0) return false;
    if (!form.daily_start || !form.daily_end) return false;
    if (form.daily_start >= form.daily_end) return false; // "HH:MM" compares lexically
  }
  return true;
}

export function scheduleFormToPayload(form: ScheduleForm): SchedulePayload {
  const timezone = form.timezone;

  if (form.schedule_type === "now") {
    return { starts_at: new Date().toISOString(), ends_at: null, timezone, recurrence: {} };
  }

  const starts_at = zonedToUtcIso(form.start_date, form.start_time, timezone);
  const ends_at = form.end_date
    ? zonedToUtcIso(form.end_date, form.end_time || "23:59", timezone)
    : null;

  if (form.schedule_type === "recurring") {
    const recurrence: Recurrence = {
      freq: "weekly",
      days: [...form.days].sort((a, b) => a - b),
      daily_start: form.daily_start,
      daily_end: form.daily_end,
    };
    return { starts_at, ends_at, timezone, recurrence };
  }

  // "later" (ends_at optional) and "range" (ends_at required) are both one-time.
  return { starts_at, ends_at, timezone, recurrence: {} };
}

/** Reverse-map a persisted schedule to the form when resuming a draft. */
export function scheduleToForm(schedule?: PublicationSchedule | null): ScheduleForm {
  const base = makeDefaultScheduleForm();
  if (!schedule) return base;

  const timezone = schedule.timezone || DEFAULT_TIMEZONE;
  const start = utcToZonedParts(schedule.starts_at, timezone);
  const end = schedule.ends_at ? utcToZonedParts(schedule.ends_at, timezone) : { date: "", time: "" };
  const rec = schedule.recurrence;
  const isWeekly = !!rec && "freq" in rec && rec.freq === "weekly";

  return {
    schedule_type: isWeekly ? "recurring" : schedule.ends_at ? "range" : "later",
    start_date: start.date,
    start_time: start.time,
    timezone,
    end_date: end.date,
    end_time: end.time,
    days: isWeekly ? rec.days : base.days,
    daily_start: isWeekly ? rec.daily_start : base.daily_start,
    daily_end: isWeekly ? rec.daily_end : base.daily_end,
  };
}
