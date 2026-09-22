import type { ChannelCategory as ChannelDomainCategory, ChannelListItem } from "../channels/types";
import { channelCategories, type ChannelCategory, type ChannelItem } from "./mock-data.ts";
import { deviceFit } from "../layouts/geometry.ts";

/** The Channel domain and this wizard spell the same categories differently
 * (`in_store` vs `in-store`), and the wizard carries an extra `others` bucket
 * that the domain has no value for. */
const CATEGORY_ID: Record<ChannelDomainCategory, ChannelItem["category"]> = {
  dooh: "dooh",
  in_store: "in-store",
  online: "online",
  social: "social",
};

/** Secondary line on a channel card: the Player and whether it is up (ADR 0074 §4). */
export function formatPlayerSummary(player: ChannelListItem["player"]): string {
  if (player === null) return "No player assigned";
  return `${player.name} · ${player.health}`;
}

/**
 * A Publication targets committed Channels only — a Draft Channel holds no device
 * reservations, so publishing to one would drive screens nothing has claimed.
 */
export function toChannelItems(channels: ChannelListItem[]): ChannelItem[] {
  return channels
    .filter((channel) => channel.lifecycle !== "draft")
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      category: CATEGORY_ID[channel.category],
      subLabel: formatPlayerSummary(channel.player),
      // A Player-less Channel has no liveness to report and reads offline.
      status: channel.player?.health ?? "offline",
      resolution: channel.expected_resolution ?? undefined,
    }));
}

/** The Player behind each selected Channel. `media_schedule_conflicts` is still
 * device-level, so the Channel selection has to be flattened before it is asked. */
export function selectedChannelDeviceIds(
  channels: ChannelListItem[],
  selectedIds: string[],
): string[] {
  const ids = new Set<string>();
  for (const channel of channels) {
    if (selectedIds.includes(channel.id) && channel.player !== null) ids.add(channel.player.id);
  }
  return [...ids];
}

export function selectedGroupItems(
  channels: ChannelListItem[],
  groupIds: readonly string[],
  groupNamesById: Readonly<Record<string, string>>,
) {
  return groupIds.map((id) => {
    const members = channels.filter((channel) => channel.groups?.some((group) => group.id === id));
    const group = members.flatMap((channel) => channel.groups ?? []).find((item) => item.id === id);
    return { id, name: groupNamesById[id] ?? group?.name ?? id, channelCount: members.length };
  });
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

/** Which selected Devices to warn about at steps 3 and 5 (ADR 0055 — advisory, never a block).
 *  A null aspectRatio means no Composition is selected, so there is nothing to fit against. */
export function summarizeGeometryFit(
  channels: readonly ChannelListItem[],
  channelIds: readonly string[],
  aspectRatio: string | null,
): { unfitting: string[]; unprofiled: string[] } {
  const unfitting = new Set<string>();
  const unprofiled = new Set<string>();
  if (!aspectRatio) return { unfitting: [], unprofiled: [] };

  const selected = new Set(channelIds);
  for (const channel of channels) {
    if (!selected.has(channel.id)) continue;
    // ADR 0074 §3: the Channel's own declared canvas is the geometry source of truth when set —
    // every screen behind it shares that one canvas. The Player's own reported resolution is only
    // the fallback for a Channel with no canvas declared; `unknown` remains the label for neither.
    if (channel.player === null) continue;
    const fit = deviceFit(channel.expected_resolution ?? channel.player.resolution, aspectRatio);
    if (fit === "unknown") unprofiled.add(channel.player.name);
    else if (fit !== "fits") unfitting.add(channel.player.name);
  }
  return {
    unfitting: [...unfitting].sort(),
    unprofiled: [...unprofiled].sort(),
  };
}
