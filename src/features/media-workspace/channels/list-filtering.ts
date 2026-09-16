import type { ChannelListItem, ChannelStatusFilter } from "./types/index.ts";
import { channelStatus, filterChannels, summarizeChannels } from "./channel-logic.ts";

export { channelStatus, filterChannels, summarizeChannels };

// D1's "Sort by" dropdown (Name A-Z / Name Z-A / Location / Status), shared with the table's
// sortable headers.
export const SORT_KEYS = ["name", "location", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDir = "asc" | "desc";
export type Sort = { key: SortKey; dir: SortDir };
export const DEFAULT_SORT: Sort = { key: "name", dir: "asc" };

export type Page<T> = { rows: T[]; page: number; totalPages: number };

export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (current - 1) * perPage;
  return { rows: items.slice(start, start + perPage), page: current, totalPages };
}

// Best health first, matching D1 (Online rows read as "good" before Warning/Offline/No player).
const STATUS_ORDER: Record<ChannelStatusFilter, number> = {
  online: 0,
  warning: 1,
  offline: 2,
  no_player: 3,
};

function sortValue(channel: ChannelListItem, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return channel.name;
    case "location":
      return channel.location?.name ?? null;
    case "status":
      return STATUS_ORDER[channelStatus(channel)];
  }
}

function compareValues(a: string | number | null, b: string | number | null, dirMultiplier: number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const raw = typeof a === "string" ? a.localeCompare(b as string) : a - (b as number);
  return raw * dirMultiplier;
}

export function sortChannels(channels: readonly ChannelListItem[], sort: Sort): ChannelListItem[] {
  const dirMultiplier = sort.dir === "asc" ? 1 : -1;

  return [...channels].sort((a, b) => {
    const cmp = compareValues(sortValue(a, sort.key), sortValue(b, sort.key), dirMultiplier);
    if (cmp !== 0) return cmp;
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
