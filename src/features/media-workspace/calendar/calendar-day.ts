import { DEFAULT_TIMEZONE, shiftYmd, utcToZonedParts } from "../publications/schedule.ts";
import { formatClock } from "../publications/now-next-view.ts";
import type { CalendarPublication, CalendarRow, CalendarSegment } from "./calendar-api.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

// ponytail: fixed +07:00 — Asia/Bangkok has no DST (ADR 0085 §2); derive from display_timezone if another zone is offered.
const OFFSET = "+07:00";
const dayStartMs = (ymd: string) => Date.parse(`${ymd}T00:00:00${OFFSET}`);

export const todayYmd = (now: Date = new Date()) => utcToZonedParts(now.toISOString(), DEFAULT_TIMEZONE).date;

/** The offset datetimes `GET /media/calendar` takes: local midnight to the next local midnight. */
export function dayRange(ymd: string): { from: string; to: string } {
  return { from: `${ymd}T00:00:00${OFFSET}`, to: `${shiftYmd(ymd, 1)}T00:00:00${OFFSET}` };
}

/** Left offset and width of a block as a share of the 24 h grid, 0–100. */
export function blockPosition(segment: CalendarSegment, ymd: string): { left: number; width: number } {
  const start = dayStartMs(ymd);
  const opens = Math.max(start, Date.parse(segment.opens_at));
  const closes = Math.min(start + DAY_MS, Date.parse(segment.closes_at));
  return { left: ((opens - start) / DAY_MS) * 100, width: Math.max(0, ((closes - opens) / DAY_MS) * 100) };
}

/** The now line's position, or null when `now` is outside the day. */
export function nowPercent(ymd: string, now: number): number | null {
  const offset = now - dayStartMs(ymd);
  return offset >= 0 && offset < DAY_MS ? (offset / DAY_MS) * 100 : null;
}

export function isNowBlock(segment: CalendarSegment, now: number): boolean {
  return Date.parse(segment.opens_at) <= now && now < Date.parse(segment.closes_at);
}

/** The next block on the same row after this one, or null (ADR 0085 §9). */
export function nextBlock(row: CalendarRow, segment: CalendarSegment): CalendarSegment | null {
  return (
    row.segments
      .filter((other) => Date.parse(other.opens_at) >= Date.parse(segment.closes_at))
      .sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at))[0] ?? null
  );
}

/** The block a row opens in Quick View: the one airing now, else the next to start, else the last of the day. */
export function defaultBlock(row: CalendarRow, now: number): CalendarSegment | null {
  const sorted = [...row.segments].sort((a, b) => Date.parse(a.opens_at) - Date.parse(b.opens_at));
  return sorted.find((segment) => isNowBlock(segment, now)) ?? sorted.find((segment) => Date.parse(segment.opens_at) > now) ?? sorted.at(-1) ?? null;
}

/** The wider occurrence this block is cut from (by a higher tier or the day edge), or null. */
export function partOf(segment: CalendarSegment): { opens_at: string; closes_at: string | null } | null {
  const { occurrence } = segment;
  if (!occurrence) return null;
  const opensEarlier = Date.parse(occurrence.opens_at) < Date.parse(segment.opens_at);
  const closesLater = occurrence.closes_at === null || Date.parse(occurrence.closes_at) > Date.parse(segment.closes_at);
  return opensEarlier || closesLater ? occurrence : null;
}

/** Where the grid opens, as a share of its width: just before now on today, else 08:00. */
export function initialScrollPercent(ymd: string, now: number): number {
  const current = nowPercent(ymd, now);
  return current === null ? (8 / 24) * 100 : Math.max(0, current - (1 / 24) * 100);
}

/** `HH:MM` in Bangkok; the day's closing midnight reads "24:00" so a block never seems to end before it starts. */
export function clockLabel(iso: string, ymd: string): string {
  return Date.parse(iso) >= dayStartMs(ymd) + DAY_MS ? "24:00" : formatClock(iso, DEFAULT_TIMEZONE);
}

/** "25 min", "2 h", "2 h 15 min". */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Edit Program with `returnTo`; a Program whose Schedule has ended opens read-only instead (ADR 0085 §9, ADR 0080 §4). */
export function programAction(publication: CalendarPublication, returnTo: string, now: number): { label: string; href: string } {
  const base = `/media-workspace/program/${publication.id}`;
  if (publication.schedule_ends_at && Date.parse(publication.schedule_ends_at) <= now) return { label: "View Program", href: base };
  return { label: "Edit Program", href: `${base}/edit?returnTo=${encodeURIComponent(returnTo)}` };
}
