import type { Screen } from "./types";
import { channelCategories, type ChannelCategory, type ChannelItem } from "./mock-data.ts";

/** Secondary line on a channel card. `connection_status` is a stored column that
 * does not track liveness — only `last_heartbeat_at` (and the `status_level`
 * derived from it: >5min = offline, >2min = warning) says whether a screen is up. */
export function formatLastSeen(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "Never connected";
  const minutes = Math.floor((now - Date.parse(iso)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 0) return "Last seen just now";
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export function toChannelItems(screens: Screen[], now = Date.now()): ChannelItem[] {
  return screens.map((s) => ({
    id: s.id,
    name: s.name,
    // ponytail: Screen has no category field yet — every screen reads as
    // dooh until the backend adds one; upgrade when that lands.
    category: "dooh" as const,
    subLabel: formatLastSeen(s.last_heartbeat_at, now),
    status: s.status_level ?? "offline",
    resolution: undefined,
  }));
}

export function filterBySearch(channels: ChannelItem[], search: string): ChannelItem[] {
  const term = search.trim().toLowerCase();
  return channels.filter((c) => c.name.toLowerCase().includes(term));
}

export function computeCategoryCounts(
  channels: ChannelItem[],
  categories: ChannelCategory[] = channelCategories,
): Record<string, number> {
  const counts: Record<string, number> = { all: channels.length };
  for (const cat of categories) {
    counts[cat.id] = channels.filter((c) => c.category === cat.id).length;
  }
  return counts;
}

export interface StatusCounts {
  online: number;
  warning: number;
  offline: number;
  total: number;
}

export function computeStatusCounts(channels: ChannelItem[]): StatusCounts {
  const online = channels.filter((c) => c.status === "online").length;
  const warning = channels.filter((c) => c.status === "warning").length;
  const offline = channels.filter((c) => c.status === "offline").length;
  return { online, warning, offline, total: channels.length };
}

export function statusPercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}
