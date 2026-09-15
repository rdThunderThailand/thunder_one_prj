import type {
  ChannelFilters,
  ChannelListItem,
  ChannelStatusFilter,
  ChannelTypeFilter,
} from "./types/index.ts";

const OUTPUT_KIND_LABEL: Record<ChannelListItem["output_kind"], string> = {
  screen: "Screen",
  tv: "TV",
  kiosk: "Kiosk",
};

/** ADR 0074 §4: status is the Player's health; a Player-less Draft is "No player", never
 *  "Degraded" (ADR 0035's aggregate leaves the model with one-Player-per-Channel). */
export function channelStatus(channel: Pick<ChannelListItem, "health">): ChannelStatusFilter {
  return channel.health ?? "no_player";
}

/** "multi" wins over Output Kind — ADR 0074 §3, D1's Type column shows "Multi-screen"
 *  regardless of which Output Kind a multi-screen Channel has. */
export function channelTypeKey(
  channel: Pick<ChannelListItem, "output_kind" | "display_config">,
): ChannelTypeFilter {
  return channel.display_config?.mode === "multi" ? "multi" : channel.output_kind;
}

export function channelTypeLabel(
  channel: Pick<ChannelListItem, "output_kind" | "display_config">,
): string {
  return channelTypeKey(channel) === "multi" ? "Multi-screen" : OUTPUT_KIND_LABEL[channel.output_kind];
}

/** D1's tiles: Total / Online / Warning / Offline. A Player-less Draft counts only in `total`
 *  (ADR 0074 §4 — there is nothing to report health for). */
export function summarizeChannels(channels: readonly ChannelListItem[]) {
  const summary = { total: channels.length, online: 0, warning: 0, offline: 0 };
  for (const channel of channels) {
    if (channel.health !== null) summary[channel.health] += 1;
  }
  return summary;
}

export function filterChannels(
  channels: readonly ChannelListItem[],
  filters: ChannelFilters,
): ChannelListItem[] {
  const search = filters.search.trim().toLowerCase();

  return channels.filter((channel) => {
    const status = channelStatus(channel);
    const matchesSearch =
      search.length === 0 ||
      channel.name.toLowerCase().includes(search) ||
      channel.location?.name.toLowerCase().includes(search) ||
      (channel.player !== null &&
        (channel.player.name.toLowerCase().includes(search) || channel.player.code.toLowerCase().includes(search)
          || channel.player.health.includes(search) || (search === "attention" && channel.player.health !== "online")));
    const matchesType = filters.type === "all" || channelTypeKey(channel) === filters.type;
    const matchesStatus = filters.status === "all" || status === filters.status;
    const matchesLifecycle = filters.lifecycle === "all" || channel.lifecycle === filters.lifecycle;

    return matchesSearch && matchesType && matchesStatus && matchesLifecycle;
  });
}

export function findChannelAttention(channels: readonly ChannelListItem[]) {
  return channels.flatMap((channel) =>
    channel.player !== null && channel.player.health !== "online" ? [{ channel, device: channel.player }] : [])
    .sort((a, b) => Number(a.device.health === "warning") - Number(b.device.health === "warning"));
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
