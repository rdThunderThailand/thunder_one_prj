"use client";

import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { BoxIcon, MonitorIcon } from "@/components/ui/icons";
import { channelStatus, channelTypeKey, channelTypeLabel } from "../channel-logic";
import { nowPlayingName, nowPlayingRemaining, nowPlayingThumbnail } from "../now-playing";
import type { Sort, SortKey } from "../list-filtering";
import type { NowNextOccurrence } from "../../publications/now-next";
import type { ChannelListItem, ChannelStatusFilter } from "../types";
import { ChannelRowActionsMenu } from "./ChannelRowActionsMenu";

const STATUS_BADGE: Record<ChannelStatusFilter, { label: string; color: BadgeColor }> = {
  online: { label: "Online", color: "green" },
  warning: { label: "Warning", color: "yellow" },
  offline: { label: "Offline", color: "red" },
  no_player: { label: "No player", color: "zinc" },
};

// No TV/Kiosk pictograms exist in the shared icon set; Monitor stands in for every screen-like
// Output Kind (Screen / TV / Multi-screen) and Box for Kiosk, matching the closest shape on hand.
const TYPE_ICON: Record<ReturnType<typeof channelTypeKey>, typeof MonitorIcon> = {
  screen: MonitorIcon,
  tv: MonitorIcon,
  kiosk: BoxIcon,
  multi: MonitorIcon,
};

function SortHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSortChange: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {label}
        {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

function ChannelRow({
  channel,
  occurrence,
  selected,
  onSelect,
  onChanged,
}: {
  channel: ChannelListItem;
  occurrence: NowNextOccurrence | null | undefined;
  selected: boolean;
  onSelect: (channel: ChannelListItem, trigger?: HTMLButtonElement) => void;
  onChanged: (updated: ChannelListItem) => void;
}) {
  const status = STATUS_BADGE[channelStatus(channel)];
  const TypeIcon = TYPE_ICON[channelTypeKey(channel)];
  const thumbnail = nowPlayingThumbnail(occurrence);
  const groups = channel.groups ?? [];
  const remaining = nowPlayingRemaining(occurrence);

  return (
    <tr
      data-testid={`channel-row-${channel.id}`}
      onClick={() => onSelect(channel)}
      className={`cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800 ${
        selected
          ? "bg-indigo-50/80 shadow-[inset_3px_0_0_#4f46e5] dark:bg-indigo-500/10"
          : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element -- a small, variably-sourced program thumbnail; not worth next/image's config here.
              <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <TypeIcon className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <button
              id={`channel-detail-trigger-${channel.id}`}
              type="button"
              aria-controls={`channel-detail-panel-${channel.id}`}
              aria-expanded={selected}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(channel, event.currentTarget);
              }}
              className="block max-w-52 truncate rounded text-left font-semibold text-zinc-950 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-50 dark:hover:text-indigo-400"
            >
              {channel.name}
            </button>
            <p className="mt-0.5 max-w-52 truncate text-xs text-zinc-400">
              {channel.description || "No description"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
        <span className="inline-flex items-center gap-1.5">
          <TypeIcon className="h-3.5 w-3.5 text-zinc-400" />
          {channelTypeLabel(channel)}
        </span>
      </td>
      <td className="px-3 py-3">
        <Badge color={status.color}>{status.label}</Badge>
      </td>
      <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
        {channel.location?.name ?? "Unassigned"}
      </td>
      <td className="px-3 py-3">
        {groups.length === 0 ? (
          <span className="text-zinc-400">–</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="pill" color="indigo">{groups[0]!.name}</Badge>
            {groups.length > 1 && <Badge variant="pill" color="zinc">+{groups.length - 1}</Badge>}
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">
        <p className="max-w-40 truncate font-medium text-zinc-700 dark:text-zinc-200">
          {nowPlayingName(occurrence)}
        </p>
        {remaining && <p className="mt-0.5 text-zinc-400">{remaining}</p>}
      </td>
      <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
        <ChannelRowActionsMenu channel={channel} onChanged={onChanged} />
      </td>
    </tr>
  );
}

export function ChannelTable({
  channels,
  nowNext,
  sort,
  onSortChange,
  selectedId,
  onSelect,
  onChanged,
}: {
  channels: ChannelListItem[];
  nowNext: Map<string, NowNextOccurrence | null>;
  sort: Sort;
  onSortChange: (key: SortKey) => void;
  selectedId: string | null;
  onSelect: (channel: ChannelListItem, trigger?: HTMLButtonElement) => void;
  onChanged: (updated: ChannelListItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
            <SortHeader label="Channel" sortKey="name" sort={sort} onSortChange={onSortChange} className="w-64 px-4 py-2.5" />
            <th className="px-3 py-2.5">Type</th>
            <SortHeader label="Status" sortKey="status" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <SortHeader label="Location" sortKey="location" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <th className="px-3 py-2.5">Groups</th>
            <th className="px-3 py-2.5">Now Playing</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((channel) => (
            <ChannelRow
              key={channel.id}
              channel={channel}
              occurrence={nowNext.get(channel.id)}
              selected={channel.id === selectedId}
              onSelect={onSelect}
              onChanged={onChanged}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
