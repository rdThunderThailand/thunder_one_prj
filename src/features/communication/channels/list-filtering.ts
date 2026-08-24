import type { ChannelCategory, ChannelListItem, ChannelLifecycle } from "./types/index.ts";
import { filterChannels, summarizeChannels } from "./channel-logic.ts";

export { filterChannels, summarizeChannels };

export const SORT_KEYS = ["name", "category", "type", "location", "devices", "lifecycle", "lastSeen"] as const;
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

const LIFECYCLE_ORDER: Record<ChannelLifecycle, number> = { active: 0, inactive: 1, draft: 2 };
function channelLastSeenMs(channel: ChannelListItem): number | null {
  let max = -1;
  for (const device of channel.devices) {
    if (device.last_heartbeat_at) {
      const ms = Date.parse(device.last_heartbeat_at);
      if (!Number.isNaN(ms) && ms > max) max = ms;
    }
  }
  return max === -1 ? null : max;
}

function sortValue(channel: ChannelListItem, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return channel.name;
    case "category":
      return channel.category;
    case "type":
      return channel.channel_type?.name ?? null;
    case "location":
      return channel.location?.name ?? null;
    case "devices":
      return channel.devices.length;
    case "lifecycle":
      return LIFECYCLE_ORDER[channel.lifecycle];
    case "lastSeen":
      return channelLastSeenMs(channel);
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

export type CategoryGroup = { category: ChannelCategory; rows: ChannelListItem[] };

const CATEGORY_ORDER: ChannelCategory[] = ["dooh", "in_store", "online", "social"];

export function groupByCategory(channels: readonly ChannelListItem[]): CategoryGroup[] {
  const groups: Record<string, ChannelListItem[]> = {
    dooh: [],
    in_store: [],
    online: [],
    social: [],
  };

  for (const channel of channels) {
    groups[channel.category].push(channel);
  }

  return CATEGORY_ORDER.filter(cat => groups[cat].length > 0).map(cat => ({ category: cat, rows: groups[cat] }));
}
