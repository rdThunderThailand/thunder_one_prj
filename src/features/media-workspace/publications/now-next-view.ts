import type { NowNextContent, NowNextOccurrence, NowNextRow } from "./now-next";

export type RowStatus = { label: "Live" | "Playback stale" | "Scheduled"; tone: "success" | "warning" | "neutral" };

/** ADR 0084 §3: "Live" only when a Player confirmed it; a row with no current Program is simply not live. */
export function rowStatus(row: NowNextRow): RowStatus {
  const state = row.current?.playback_state;
  if (state === "confirmed") return { label: "Live", tone: "success" };
  if (state === "stale") return { label: "Playback stale", tone: "warning" };
  return { label: "Scheduled", tone: "neutral" };
}

/** `m:ss`, or `h:mm:ss` from one hour up; "—" for an open-ended occurrence. */
export function formatRemaining(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

/** Share of the current occurrence already played, 0–100; null without an end (nothing to measure against). */
export function elapsedPercent(occurrence: NowNextOccurrence, asOf: string): number | null {
  if (!occurrence.closes_at) return null;
  const opens = new Date(occurrence.opens_at).getTime();
  const span = new Date(occurrence.closes_at).getTime() - opens;
  if (span <= 0) return null;
  return Math.max(0, Math.min(100, ((new Date(asOf).getTime() - opens) / span) * 100));
}

export type NextEntry = { kind: "next"; occurrence: NowNextOccurrence } | { kind: "continues" } | null;

/** "Continues" when a current Program has no end and nothing follows it (ADR 0084 §8). */
export function nextEntry(row: NowNextRow): NextEntry {
  const [upcoming] = row.upcoming;
  if (upcoming) return { kind: "next", occurrence: upcoming };
  if (row.current && !row.current.closes_at) return { kind: "continues" };
  return null;
}

/** A Layout opens on its preview, a user Playlist on its editor; image / video / other have no page (ADR 0084 §7). */
export function contentHref(content: NowNextContent): string | null {
  if (!content.id) return null;
  if (content.kind === "layout") return `/media-workspace/layouts/${content.id}?preview=1`;
  if (content.kind === "playlist") return `/media-workspace/playlists/${content.id}`;
  return null;
}

/** ⋮ → Edit Program: only when exactly one Program is current; `returnTo` brings the operator back (ADR 0084 §7, §9). */
export function editProgramHref(row: NowNextRow, returnTo: string): string | null {
  if (row.current?.publications.length !== 1) return null;
  return `/media-workspace/program/${row.current.publications[0].id}/edit?returnTo=${encodeURIComponent(returnTo)}`;
}

/** `HH:MM` in the display time zone. */
export function formatClock(value: string | number | Date | null | undefined, timeZone: string): string {
  if (value == null) return "—";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(value));
}
