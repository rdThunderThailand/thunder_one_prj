import type { PublicationSchedule, Recurrence } from "./types";

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

/** Day-of-week for a pure "YYYY-MM-DD", 0=Sun..6=Sat (timezone-independent). */
export function ymdDow(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Day-of-month for a pure "YYYY-MM-DD". A month without that day simply never matches. */
function ymdDay(ymd: string): number {
  return Number(ymd.slice(8, 10));
}

// --- airing state, for the Overview "Now & Next" card ------------------------
// Time-of-day granularity (the Edit/Create previews are day granularity): this answers "on air
// at this minute?", so a weekly window of 08:00-17:00 is not live at 22:00.

export type AiringState = "live" | "next" | "ended";

/**
 * Is the publication on air now, still to come, or finished?
 *
 * `null` means "cannot tell" — no schedule, or one we can't parse. Callers must
 * surface that rather than guessing a bucket; claiming something is live when we
 * don't know is the bug this function exists to prevent.
 */
export function classifyPublicationAiring(
  schedule: PublicationSchedule | null | undefined,
  now: Date = new Date()
): AiringState | null {
  if (!schedule?.starts_at) return null;

  const start = Date.parse(schedule.starts_at);
  if (Number.isNaN(start)) return null;
  const end = schedule.ends_at ? Date.parse(schedule.ends_at) : null;
  const instant = now.getTime();

  if (instant < start) return "next";
  if (end !== null && !Number.isNaN(end) && instant >= end) return "ended";

  const rec = schedule.recurrence;
  if (!rec || !("freq" in rec)) return "live"; // one-off: the whole window is on air

  // Weekly/monthly: inside the overall window, but only on listed days and within
  // the daily time window — both read in the publication's own timezone.
  const { date, time } = utcToZonedParts(now.toISOString(), schedule.timezone);
  if (!recurrenceAirsOn(rec, date)) return "next";
  return withinDailyWindow(time, rec.daily_start, rec.daily_end) ? "live" : "next";
}

/** Does a weekly / monthly / dates recurrence air on this local "YYYY-MM-DD"? Mirrors Thunder_Core's
 *  `media_core.recurrence_airs_on` (ADR 0012, 0014); the daily window is checked separately. */
export function recurrenceAirsOn(recurrence: Recurrence, ymd: string): boolean {
  if (!("freq" in recurrence)) return true;
  // `in` does not narrow away the `{}` member (it has an index signature), so narrow by hand.
  const rec = recurrence as Exclude<Recurrence, Record<string, never>>;
  if (rec.freq === "dates") return rec.dates.includes(ymd);
  if (rec.freq === "monthly") return rec.month_days.includes(ymdDay(ymd));
  return rec.days.includes(ymdDow(ymd));
}

/** "HH:MM" comparison. An end at or before the start means the window wraps midnight. */
function withinDailyWindow(time: string, start: string, end: string): boolean {
  if (!start || !end) return true;
  if (start === "00:00" && end === "23:59") return true;
  return end > start ? time >= start && time < end : time >= start || time < end;
}

export function shiftYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

/** "YYYY-MM-DD" -> "08/10/2026": the one date format every schedule surface prints (QA 2026-10-08 #20).
 *  String-only, so the viewer's timezone never shifts a wall-clock day. */
export function formatDmy(ymd: string): string {
  const [year, month, day] = ymd.split("-");
  return `${day}/${month}/${year}`;
}

/** The card's "Start Time" cell: a daily window when weekly, else the start instant. */
export function formatScheduleStart(
  schedule: PublicationSchedule | null | undefined,
  now: Date = new Date()
): string {
  if (!schedule?.starts_at) return "—";

  const rec = schedule.recurrence;
  if (rec && "freq" in rec && rec.daily_start && rec.daily_end) {
    return `${rec.daily_start}–${rec.daily_end}`;
  }

  const start = utcToZonedParts(schedule.starts_at, schedule.timezone);
  const today = utcToZonedParts(now.toISOString(), schedule.timezone).date;
  if (start.date === today) return `วันนี้ ${start.time}`;
  if (start.date === shiftYmd(today, 1)) return `พรุ่งนี้ ${start.time}`;
  if (start.date === shiftYmd(today, -1)) return `เมื่อวาน ${start.time}`;
  return `${formatDmy(start.date)} ${start.time}`;
}

/** "Day 1, 15, 31" — the month days of a monthly schedule, ascending. */
export function formatMonthDays(monthDays: number[]): string {
  return `Day ${[...monthDays].sort((a, b) => a - b).join(", ")}`;
}

/** Position one schedule window on a midnight-to-midnight review timeline. */
export function getDayTimelinePlacement(startTime: string, endTime: string): {
  leftPercent: number;
  widthPercent: number;
} {
  const minutes = (time: string) => {
    const [hours = 0, mins = 0] = time.split(":").map(Number);
    return Math.min(24 * 60, Math.max(0, hours * 60 + mins));
  };
  const start = minutes(startTime);
  const parsedEnd = minutes(endTime);
  const end = parsedEnd > start ? parsedEnd : 24 * 60;
  const toPercent = (value: number) => Number(((value / (24 * 60)) * 100).toFixed(4));

  return {
    leftPercent: toPercent(start),
    widthPercent: toPercent(end - start),
  };
}
