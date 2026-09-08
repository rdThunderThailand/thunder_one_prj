// ADR 0065 §3. Overview's today's-schedule panel is a fold of the Publications list alone —
// `media_publications_list` now carries the Schedule window, its zone, and the target split, so
// the panel resolves no per-Publication detail.
//
// Both halves live here rather than inline in the component because neither is exercisable from
// the browser: no Schedule in either database sits outside `Asia/Bangkok`, and no Publication
// targets Channels and Devices at once. The check file is the only proof those branches work.

import type { PublicationListItem } from "@/features/media-workspace/publications";

/** ADR 0031 permits a Schedule in any zone; rows written before that default to Bangkok. */
const FALLBACK_TIMEZONE = "Asia/Bangkok";

function isSameDay(iso: string, timeZone: string, now: Date) {
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return format.format(new Date(iso)) === format.format(now);
}

/** The panel's rows: Publications whose Schedule starts today **in the Schedule's own zone**,
 *  earliest first. A Publication with no Schedule has no start and never appears. */
export function todaysSchedule(rows: PublicationListItem[], now = new Date()) {
  return rows
    .filter((row) => row.starts_at && isSameDay(row.starts_at, row.timezone ?? FALLBACK_TIMEZONE, now))
    .sort((a, b) => Date.parse(a.starts_at!) - Date.parse(b.starts_at!))
    .slice(0, 6);
}

/** `X Channels · Y Devices`, the vocabulary the Program cards on the same page already use.
 *  The panel counted every target as a Channel before ADR 0065 §3; this is the correction. */
export function targetSummary(summary: PublicationListItem["target_summary"]) {
  const parts = [];
  if (summary?.channels) parts.push(`${summary.channels} Channels`);
  if (summary?.devices) parts.push(`${summary.devices} Devices`);
  return parts.join(" · ") || "No targets";
}

/** The row's clock, read in the Schedule's own zone. */
export function scheduleTime(row: PublicationListItem) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: row.timezone ?? FALLBACK_TIMEZONE,
  }).format(new Date(row.starts_at!));
}
