import type { MediaDeviceHealth } from "../../types/domain.ts";
import type {
  ChannelDraftInput,
  ChannelFilters,
  ChannelHealth,
  ChannelListItem,
} from "./types/index.ts";

export function deriveChannelHealth(healths: readonly MediaDeviceHealth[]): ChannelHealth {
  if (healths.length === 0) return null;
  if (healths.every((health) => health === "online")) return "online";
  if (healths.every((health) => health === "offline")) return "offline";
  if (healths.some((health) => health === "offline")) return "degraded";
  return "warning";
}

export function summarizeChannels(channels: readonly ChannelListItem[]) {
  const summary = {
    lifecycle: { total: channels.length, draft: 0, active: 0, inactive: 0 },
    health: { online: 0, warning: 0, degraded: 0, offline: 0, unknown: 0 },
    unassigned: 0,
  };

  for (const channel of channels) {
    summary.lifecycle[channel.lifecycle] += 1;
    if (channel.health === null) summary.health.unknown += 1;
    else summary.health[channel.health] += 1;
    if (channel.devices.length === 0) summary.unassigned += 1;
  }

  return summary;
}

export function filterChannels(
  channels: readonly ChannelListItem[],
  filters: ChannelFilters,
): ChannelListItem[] {
  const search = filters.search.trim().toLowerCase();

  return channels.filter((channel) => {
    const matchesSearch =
      search.length === 0 ||
      channel.name.toLowerCase().includes(search) ||
      channel.location?.name.toLowerCase().includes(search) ||
      channel.devices.some(
        (device) =>
          device.name.toLowerCase().includes(search) || device.code.toLowerCase().includes(search),
      );
    const matchesCategory = filters.category === "all" || channel.category === filters.category;
    const matchesLifecycle = filters.lifecycle === "all" || channel.lifecycle === filters.lifecycle;
    const matchesHealth =
      filters.health === "all" ||
      (filters.health === "unknown" ? channel.health === null : channel.health === filters.health);

    return matchesSearch && matchesCategory && matchesLifecycle && matchesHealth;
  });
}

export function formatChannelLastSeen(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "Never connected";
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  return `Last seen ${Math.floor(hours / 24)}d ago`;
}

export function validateChannelDraft(input: ChannelDraftInput): Partial<Record<"name" | "channel_type_id", string>> {
  const errors: Partial<Record<"name" | "channel_type_id", string>> = {};
  if (!input.name.trim()) errors.name = "กรุณาระบุชื่อ Channel";
  if (!input.channel_type_id) errors.channel_type_id = "กรุณาเลือก Channel Type";
  return errors;
}
