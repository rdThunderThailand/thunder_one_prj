import type { FailureReason, PlaybackProofEntry } from "./playback-proof-api.ts";

export const FAILURE_LABELS: Record<FailureReason, string> = {
  decode_error: "Cannot decode",
  file_missing: "File missing",
  file_corrupt: "File corrupt",
  playback_stalled: "Playback stalled",
  other: "Other error",
};

export const SOURCE_LABELS = { playlist: "Playlist", composition: "Layout", media: "Media" } as const;

/** "0:10", "2:05", "1:02:05" — seconds on screen. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Airtime card: "45 s", "12 min", "3 h 20 min". */
export function formatAirtime(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s`;
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `${minutes} min`;
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

/** "30 Sep 2026" and "10:32:15" in the display zone, for the two-line Played-at cell. */
export function formatPlayedAt(iso: string, timeZone: string): { date: string; time: string } {
  const at = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone }).format(at),
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone }).format(at),
  };
}

/** "1.2 MB", "820 KB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export type RelatedLink = { label: string; name: string; href: string | null; note?: string };

/** The drawer's Related objects (ADR 0089 §8): existing routes for the *current* object; a Trash or
 *  unknown target keeps its row with no link rather than disappearing. */
export function relatedLinks(entry: PlaybackProofEntry): RelatedLink[] {
  const links: RelatedLink[] = [
    entry.channel
      ? { label: "Channel", name: entry.channel.name, href: `/media-workspace/channels?channel=${entry.channel.id}` }
      : { label: "Channel", name: entry.device.name ?? "Media Device", href: null, note: "Not in a Channel when it played" },
  ];
  if (entry.program) {
    links.push({ label: "Program", name: entry.program.name, href: `/media-workspace/program/${entry.program.id}` });
  }
  const { source } = entry;
  if (source && source.type !== "media") {
    const base = source.type === "playlist" ? "/media-workspace/playlists" : "/media-workspace/compositions";
    // A null id means the Playlist/Layout row is gone for good; it keeps its row, like Trash, with no link.
    const isGone = source.id === null;
    links.push({
      label: SOURCE_LABELS[source.type],
      name: source.name ?? SOURCE_LABELS[source.type],
      href: source.in_trash || isGone ? null : `${base}/${source.id}`,
      note: isGone ? "No longer exists" : source.in_trash ? "In Trash" : "May have changed since it aired",
    });
  }
  links.push({
    label: "Media",
    name: entry.media.title,
    href: entry.media.in_trash ? null : `/media-workspace/assets/${entry.media.id}`,
    note: entry.media.in_trash ? "In Trash" : undefined,
  });
  return links;
}

/** "Playlist · Morning Playlist", "Layout · Lobby (Main zone)", or null when unattributed. */
export function sourceLabel(entry: Pick<PlaybackProofEntry, "source" | "zone_name">): string | null {
  const { source, zone_name } = entry;
  if (!source) return null;
  const kind = SOURCE_LABELS[source.type];
  const name = source.name ? `${kind} · ${source.name}` : kind;
  return zone_name ? `${name} (${zone_name})` : name;
}
