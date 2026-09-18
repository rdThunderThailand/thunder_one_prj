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
          <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-card py-1 shadow-lg">
            {groups.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No Channel Groups yet.</p>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void addTo(group)}
                  className="block w-full truncate px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed"
                >
                  {group.name}
                </button>
              ))
            )}
            {error && <p className="px-3 py-2 text-xs text-danger">{error}</p>}
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
  selectedChannelId,
  onSelectionChange,
  onSelect,
  onCreateGroup,
  onGroupChanged,
}: {
  channels: ChannelListItem[];
  groups: ChannelGroup[];
  selected: Set<string>;
  selectedChannelId: string | null;
  onSelectionChange: (next: Set<string>) => void;
  onSelect: (channel: ChannelListItem) => void;
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
      <div className="flex items-center justify-between gap-3 rounded-lg bg-primary-soft px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-primary">
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
            <tr className="border-b border-border bg-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={channels.length > 0 && selected.size === channels.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-ring/30"
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
                <tr
                  key={channel.id}
                  tabIndex={0}
                  onClick={() => onSelect(channel)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(channel);
                    }
                  }}
                  className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted ${
                    selectedChannelId === channel.id ? "bg-primary-soft" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(channel.id)}
                      onChange={() => toggle(channel.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring/30"
                    />
                  </td>
                  <td className="px-3 py-3 font-semibold text-foreground">{channel.name}</td>
                  <td className="px-3 py-3 text-muted-foreground capitalize">{channel.output_kind}</td>
                  <td className="px-3 py-3 text-muted-foreground">{channel.location?.name ?? "Unassigned"}</td>
                  <td className="px-3 py-3">
                    <Badge color={status.color}>{status.label}</Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {new Date(channel.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    <AddToGroupMenu channel={channel} groups={groups} onAdded={onGroupChanged} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {channels.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No ungrouped channels.</p>}
      </div>
    </div>
  );
}
