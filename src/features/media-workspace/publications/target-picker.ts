import type { ChannelListItem } from "../channels/types/index.ts";
import type { PublicationTarget } from "./types";

export type TargetSelection = { channelIds: string[]; groupIds: string[] };

/** A Program targets committed Channels only — a Draft Channel holds no device reservation. */
export function targetableChannels(channels: readonly ChannelListItem[]): ChannelListItem[] {
  return channels.filter((channel) => channel.lifecycle !== "draft");
}

export function selectionFromTargets(targets: readonly PublicationTarget[]): TargetSelection {
  return {
    channelIds: targets.flatMap((t) => (t.target_type === "channel" && t.channel_id ? [t.channel_id] : [])),
    groupIds: targets.flatMap((t) => (t.target_type === "group" && t.group_id ? [t.group_id] : [])),
  };
}

/** Channels the selection reaches: picked directly, or through a picked Group. */
export function reachedChannels(channels: readonly ChannelListItem[], selection: TargetSelection): ChannelListItem[] {
  return channels.filter(
    (channel) =>
      selection.channelIds.includes(channel.id) || channel.groups?.some((group) => selection.groupIds.includes(group.id)),
  );
}

/** Target Summary (frame 07): Channels + Locations. No screen count — one Player per Channel (ADR 0074). */
export function targetSummary(channels: readonly ChannelListItem[], selection: TargetSelection) {
  const reached = reachedChannels(channels, selection);
  return { channels: reached.length, locations: new Set(reached.flatMap((c) => (c.location ? [c.location.id] : []))).size };
}

/**
 * Targets after Apply. `device` targets are not editable here and pass through untouched; every
 * Channel / Group is rebuilt from the selection, named from the list so the Program cards read right.
 */
export function targetsFromSelection(
  current: readonly PublicationTarget[],
  selection: TargetSelection,
  channels: readonly ChannelListItem[],
  groups: readonly { id: string; name: string }[],
): PublicationTarget[] {
  const nameOf = (type: "channel" | "group", id: string, list: readonly { id: string; name: string }[]) =>
    list.find((item) => item.id === id)?.name ??
    current.find((t) => t.target_type === type && (t.channel_id ?? t.group_id) === id)?.name ??
    null;

  return [
    ...current.filter((t) => t.target_type === "device"),
    ...selection.channelIds.map((id) => ({ target_type: "channel" as const, channel_id: id, name: nameOf("channel", id, channels) })),
    ...selection.groupIds.map((id) => ({ target_type: "group" as const, group_id: id, name: nameOf("group", id, groups) })),
  ];
}

export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

/** Rows per facet value, for the counts beside the filter choices. */
export function facetCounts<T extends string>(values: readonly T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}
