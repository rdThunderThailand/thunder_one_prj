"use client";

import { useState } from "react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InfoIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import { isSyncConflict, setChannelGroupMembers } from "../services/channel-groups-api";
import type { ChannelListItem, ChannelStatusFilter } from "../../channels/types";
import type { ChannelGroup } from "../types";

const STATUS_BADGE: Record<ChannelStatusFilter, { label: string; color: BadgeColor }> = {
  online: { label: "Online", color: "green" },
  warning: { label: "Warning", color: "yellow" },
  offline: { label: "Offline", color: "red" },
  no_player: { label: "No player", color: "zinc" },
};

function AddToGroupMenu({
  channel,
  groups,
  onAdded,
}: {
  channel: ChannelListItem;
  groups: ChannelGroup[];
  onAdded: (group: ChannelGroup) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTo = async (group: ChannelGroup) => {
    setBusy(true);
    setError(null);
    try {
      onAdded(await setChannelGroupMembers(group.id, [...group.members.map((m) => m.id), channel.id]));
      setOpen(false);
    } catch (caught) {
      const message =
        caught instanceof Error && (isSyncConflict(caught.message) || isDuplicateName(caught.message))
          ? "This channel is already in another synchronized Group."
          : classifyApiError(caught, "Could not add this channel to the Group. Try again.").message;
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block" onClick={(event) => event.stopPropagation()}>
      <Button type="button" variant="secondary" onClick={() => setOpen((v) => !v)} className="!px-2.5 !py-1.5 text-xs">
        Add to Group
      </Button>
      {open && (
        <>
          <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            {groups.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-400">No Channel Groups yet.</p>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void addTo(group)}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {group.name}
                </button>
              ))
            )}
            {error && <p className="px-3 py-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

/** D13: channels with no Group. Selection here seeds the Create Group modal's pre-selected
 *  members (D14). "Last Content" from the mockup has no real data source (same deviation as
 *  ticket 07/08/09) and is left out rather than invented. */
export function UngroupedChannelsTable({
  channels,
  groups,
  selected,
  onSelectionChange,
  onCreateGroup,
  onGroupChanged,
}: {
  channels: ChannelListItem[];
  groups: ChannelGroup[];
  selected: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onCreateGroup: () => void;
  onGroupChanged: (group: ChannelGroup) => void;
}) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    onSelectionChange(selected.size === channels.length ? new Set() : new Set(channels.map((c) => c.id)));
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50/60 px-4 py-3 text-sm dark:bg-indigo-500/10">
        <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
          <InfoIcon className="h-4 w-4 shrink-0" />
          {selected.size > 0
            ? `${selected.size} channel(s) selected.`
            : "These channels are not assigned to any group yet."}
        </span>
        <Button type="button" onClick={onCreateGroup} className="shrink-0">
          Create Group
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={channels.length > 0 && selected.size === channels.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-3 py-2.5">Channel Name</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Location</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Last Updated</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => {
              const status = STATUS_BADGE[channel.health ?? "no_player"];
              return (
                <tr key={channel.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(channel.id)}
                      onChange={() => toggle(channel.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-950 dark:text-zinc-50">{channel.name}</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300 capitalize">{channel.output_kind}</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">{channel.location?.name ?? "Unassigned"}</td>
                  <td className="px-3 py-3">
                    <Badge color={status.color}>{status.label}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(channel.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AddToGroupMenu channel={channel} groups={groups} onAdded={onGroupChanged} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {channels.length === 0 && <p className="p-6 text-center text-sm text-zinc-400">No ungrouped channels.</p>}
      </div>
    </div>
  );
}
