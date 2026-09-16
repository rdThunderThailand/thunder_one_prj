import type { ChannelListItem } from "../channels/types";
import type { ChannelGroup } from "./types";

export function summarizeGroups(groups: ChannelGroup[]) {
  return {
    total: groups.length,
    active: groups.filter((g) => g.status === "active").length,
    disabled: groups.filter((g) => g.status === "disabled").length,
  };
}

export function isUngrouped(channel: ChannelListItem): boolean {
  return (channel.groups ?? []).length === 0;
}

export function ungroupedChannels(channels: ChannelListItem[]): ChannelListItem[] {
  return channels.filter(isUngrouped);
}

export function channelsInGroupsCount(channels: ChannelListItem[]): number {
  return channels.length - ungroupedChannels(channels).length;
}

/** Cross-references a Group's `members` (id/name only) against the full Channels list to
 *  get live health, since `/media/channel-groups` does not carry per-member status. */
export function memberHealthCounts(
  group: ChannelGroup,
  channelsById: Map<string, ChannelListItem>
): { online: number; offline: number; warning: number } {
  let online = 0;
  let offline = 0;
  let warning = 0;
  for (const member of group.members) {
    const health = channelsById.get(member.id)?.health;
    if (health === "online") online++;
    else if (health === "warning") warning++;
    else offline++;
  }
  return { online, offline, warning };
}

export function channelsById(channels: ChannelListItem[]): Map<string, ChannelListItem> {
  return new Map(channels.map((c) => [c.id, c]));
}
