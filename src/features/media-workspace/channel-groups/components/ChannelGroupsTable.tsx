"use client";

import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { ShareNodesIcon, UsersIcon } from "@/components/ui/icons";
import type { ChannelGroup } from "../types";

const STATUS_BADGE: Record<ChannelGroup["status"], { label: string; color: BadgeColor }> = {
  active: { label: "Active", color: "green" },
  disabled: { label: "Inactive", color: "zinc" },
};

const MODE_ICON = { synchronized: ShareNodesIcon, independent: UsersIcon } as const;

function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ChannelGroupsTable({
  groups,
  selectedId,
  onSelect,
}: {
  groups: ChannelGroup[];
  selectedId: string | null;
  onSelect: (group: ChannelGroup) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
            <th className="w-64 px-4 py-2.5">Group Name</th>
            <th className="px-3 py-2.5">Mode</th>
            <th className="px-3 py-2.5">Channels</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Description</th>
            <th className="px-3 py-2.5">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const status = STATUS_BADGE[group.status];
            const ModeIcon = MODE_ICON[group.playback_mode];
            const selected = group.id === selectedId;
            return (
              <tr
                key={group.id}
                onClick={() => onSelect(group)}
                className={`cursor-pointer border-b border-zinc-100 transition-colors last:border-0 dark:border-zinc-800 ${
                  selected
                    ? "bg-indigo-50/80 shadow-[inset_3px_0_0_#4f46e5] dark:bg-indigo-500/10"
                    : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="max-w-56 truncate font-semibold text-zinc-950 dark:text-zinc-50">{group.name}</p>
                </td>
                <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <ModeIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {group.playback_mode}
                  </span>
                </td>
                <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">{group.member_count}</td>
                <td className="px-3 py-3">
                  <Badge color={status.color}>{status.label}</Badge>
                </td>
                <td className="max-w-56 truncate px-3 py-3 text-zinc-600 dark:text-zinc-300">
                  {group.description || <span className="text-zinc-400">–</span>}
                </td>
                <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(group.updated_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
