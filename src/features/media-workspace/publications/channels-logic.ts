import type { ChannelCategory as ChannelDomainCategory, ChannelListItem } from "../channels/types";
import { channelCategories, type ChannelCategory, type ChannelItem, type ChannelStatus } from "./mock-data.ts";
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

/** ADR 0037 dropped the channel-level health value; the card's dot is rolled up from the
 * devices instead. A Channel with none assigned has no liveness to report and reads offline. */
function toCardStatus(devices: ChannelListItem["devices"]): ChannelStatus {
  if (devices.length === 0) return "offline";
  if (devices.every((device) => device.health === "online")) return "online";
  if (devices.every((device) => device.health === "offline")) return "offline";
  return "warning";
}

/** Secondary line on a channel card: how much of the Channel is actually up. */
export function formatDeviceSummary(devices: ChannelListItem["devices"]): string {
  if (devices.length === 0) return "No devices assigned";
  const online = devices.filter((device) => device.health === "online").length;
  return `${online}/${devices.length} devices online`;
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
      subLabel: formatDeviceSummary(channel.devices),
      status: toCardStatus(channel.devices),
      resolution: channel.expected_resolution ?? undefined,
    }));
}

/** Every device behind the selected Channels. `media_schedule_conflicts` is still
 * device-level, so the Channel selection has to be flattened before it is asked. */
export function selectedChannelDeviceIds(
  channels: ChannelListItem[],
  selectedIds: string[],
): string[] {
  const ids = new Set<string>();
  for (const channel of channels) {
    if (!selectedIds.includes(channel.id)) continue;
    for (const device of channel.devices) ids.add(device.id);
  }
  return [...ids];
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
    for (const device of channel.devices) {
      const fit = deviceFit(device.resolution, aspectRatio);
      if (fit === "unknown") unprofiled.add(device.name);
      else if (fit !== "fits") unfitting.add(device.name);
    }
  }
  return {
    unfitting: [...unfitting].sort(),
    unprofiled: [...unprofiled].sort(),
  };
}
