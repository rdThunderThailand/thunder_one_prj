import type { NowNextOccurrence, NowNextRow } from "../publications/now-next.ts";

/** Only "channel" rows carry a Channel id; a `null` value means the Channel is in the response
 *  but nothing is airing right now — distinct from a Channel absent from `rows` entirely. */
export function indexNowNextByChannel(
  rows: readonly NowNextRow[],
): Map<string, NowNextOccurrence | null> {
  const index = new Map<string, NowNextOccurrence | null>();
  for (const row of rows) {
    if (row.row_type === "channel" && row.channel) {
      index.set(row.channel.id, row.current);
    }
  }
  return index;
}

/** D1's Now Playing name. A `merged_loop` with more than one Publication reads as
 *  "<first> +N more" in the table; the detail panel lists every name on its own (ADR 0065). */
export function nowPlayingName(occurrence: NowNextOccurrence | null | undefined): string {
  if (!occurrence || occurrence.publications.length === 0) return "–";
  const [first, ...rest] = occurrence.publications;
  const firstName = first!.content_name ?? first!.name;
  return rest.length === 0 ? firstName : `${firstName} +${rest.length} more`;
}

export function nowPlayingThumbnail(occurrence: NowNextOccurrence | null | undefined): string | null {
  return occurrence?.publications[0]?.thumbnail_url ?? null;
}

/** The detail panel lists every airing Publication name on its own line (ADR 0065), unlike the
 *  table's collapsed "<first> +N more". */
export function nowPlayingAllNames(occurrence: NowNextOccurrence | null | undefined): string[] {
  return occurrence?.publications.map((publication) => publication.content_name ?? publication.name) ?? [];
}

/** "12:00 – 14:00" in the Now & Next display timezone — matches `NowNextPage`'s own `formatTime`. */
export function nowPlayingWindow(
  occurrence: NowNextOccurrence | null | undefined,
  timezone: string,
): string | null {
  if (!occurrence) return null;
  const format = (iso: string) =>
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(
      new Date(iso),
    );
  return occurrence.closes_at
    ? `${format(occurrence.opens_at)} – ${format(occurrence.closes_at)}`
    : format(occurrence.opens_at);
}

/** "1h 20m left" / "20m left" / "1h left" — mirrors `formatChannelLastSeen`'s rounding style. */
export function nowPlayingRemaining(occurrence: NowNextOccurrence | null | undefined): string | null {
  if (!occurrence || occurrence.remaining_seconds === null) return null;
  const totalMinutes = Math.max(0, Math.round(occurrence.remaining_seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m left`;
  if (minutes === 0) return `${hours}h left`;
  return `${hours}h ${minutes}m left`;
}
