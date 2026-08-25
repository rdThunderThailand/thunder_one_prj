"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { ChevronDownIcon } from "@/components/ui/icons";
import { countOnlineDevices, formatChannelLastSeen } from "../channel-logic";
import type { CategoryGroup, Sort, SortKey } from "../list-filtering";
import type {
  ChannelCategory,
  ChannelLifecycle,
  ChannelListItem,
} from "../types";

const categoryLabels: Record<ChannelCategory, string> = {
  dooh: "DOOH",
  in_store: "In-store",
  online: "Online",
  social: "Social",
};

const lifecycleBadges: Record<ChannelLifecycle, { label: string; color: BadgeColor }> = {
  draft: { label: "Draft", color: "zinc" },
  active: { label: "Active", color: "green" },
  inactive: { label: "Inactive", color: "zinc" },
};

function latestHeartbeat(channel: ChannelListItem): string | null {
  let latest: string | null = null;
  for (const device of channel.devices) {
    if (
      device.last_heartbeat_at &&
      (latest === null || Date.parse(device.last_heartbeat_at) > Date.parse(latest))
    ) {
      latest = device.last_heartbeat_at;
    }
  }
  return latest;
}

function expectedOutput(channel: ChannelListItem): string {
  const orientation = channel.expected_orientation
    ? channel.expected_orientation[0].toUpperCase() + channel.expected_orientation.slice(1)
    : null;
  return [orientation, channel.expected_resolution].filter(Boolean).join(" · ") || "Not set";
}

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

function CategoryGroupRows({
  group,
  selectedId,
  onSelect,
}: {
  group: CategoryGroup;
  selectedId: string | null;
  onSelect: (channel: ChannelListItem, trigger?: HTMLButtonElement) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <td colSpan={10} className="px-3 py-2">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300"
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`}
            />
            {categoryLabels[group.category]} ({group.rows.length})
          </button>
        </td>
      </tr>
      {open &&
        group.rows.map((channel) => {
          const lifecycle = lifecycleBadges[channel.lifecycle];
          const online = countOnlineDevices(channel.devices);
          const selected = channel.id === selectedId;

          return (
            <tr
              key={channel.id}
              data-testid={`channel-row-${channel.id}`}
              onClick={() => onSelect(channel)}
              className={`cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800 ${
                selected
                  ? "bg-indigo-50/80 shadow-[inset_3px_0_0_#4f46e5] dark:bg-indigo-500/10"
                  : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
              }`}
            >
              <td className="px-4 py-3">
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
              </td>
              <td className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                {categoryLabels[channel.category]}
              </td>
              <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                {channel.channel_type?.name ?? "Not set"}
              </td>
              <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                {channel.location?.name ?? "Unassigned"}
              </td>
              <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                {channel.devices.length === 0 ? (
                  <span className="text-zinc-400">Unassigned</span>
                ) : (
                  <span
                    className={`tabular-nums ${
                      online === channel.devices.length
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {online}/{channel.devices.length} online
                  </span>
                )}
              </td>
              <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                {expectedOutput(channel)}
              </td>
              <td className="px-3 py-3">
                <Badge color={lifecycle.color} variant="pill">
                  {lifecycle.label}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                {formatChannelLastSeen(latestHeartbeat(channel))}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/media-workspace/channels/${channel.id}/edit`}
                  onClick={(event) => event.stopPropagation()}
                  className="rounded-md px-2 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  Edit
                </Link>
              </td>
            </tr>
          );
        })}
    </>
  );
}

export function ChannelTable({
  groups,
  sort,
  onSortChange,
  selectedId,
  onSelect,
}: {
  groups: CategoryGroup[];
  sort: Sort;
  onSortChange: (key: SortKey) => void;
  selectedId: string | null;
  onSelect: (channel: ChannelListItem, trigger?: HTMLButtonElement) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
            <SortHeader label="Channel" sortKey="name" sort={sort} onSortChange={onSortChange} className="w-56 px-4 py-2.5" />
            <SortHeader label="Category" sortKey="category" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <SortHeader label="Type" sortKey="type" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <SortHeader label="Location" sortKey="location" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <SortHeader label="Devices" sortKey="devices" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <th className="px-3 py-2.5">Expected output</th>
            <SortHeader label="Status" sortKey="lifecycle" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <SortHeader label="Last seen" sortKey="lastSeen" sort={sort} onSortChange={onSortChange} className="px-3 py-2.5" />
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <CategoryGroupRows
              key={group.category}
              group={group}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
