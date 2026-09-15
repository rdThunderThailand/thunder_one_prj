"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchIcon } from "@/components/ui/icons";
import { classifyApiError, isDuplicateName } from "@/lib/api/api-error";
import { isSyncConflict, setChannelGroupMembers } from "../services/channel-groups-api";
import type { ChannelListItem } from "../../channels/types";
import type { ChannelGroup } from "../types";

/** D16: search + checklist, replace-the-whole-set on Save (same convention as the members PUT). */
export function ManageChannelsModal({
  group,
  channels,
  onClose,
  onSaved,
}: {
  group: ChannelGroup;
  channels: ChannelListItem[];
  onClose: () => void;
  onSaved: (group: ChannelGroup) => void;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set(group.members.map((m) => m.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return channels;
    return channels.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.location?.name ?? "").toLowerCase().includes(q)
    );
  }, [channels, search]);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      onSaved(await setChannelGroupMembers(group.id, Array.from(checked)));
    } catch (caught) {
      if (caught instanceof Error && isSyncConflict(caught.message)) {
        setError("A channel can only belong to one synchronized Group at a time. Remove it from the other Group first.");
      } else if (caught instanceof Error && isDuplicateName(caught.message)) {
        setError(caught.message);
      } else {
        setError(classifyApiError(caught, "Could not update this Group's members. Try again.").message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Manage Channels — ${group.name}`}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <label className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search channels by name or location…"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{checked.size} selected</span>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">No channels match your search.</p>
          ) : (
            filtered.map((channel) => (
              <label
                key={channel.id}
                className="flex cursor-pointer items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={checked.has(channel.id)}
                  onChange={() => toggle(channel.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{channel.name}</p>
                  <p className="truncate text-xs text-zinc-400">{channel.location?.name ?? "Unassigned"}</p>
                </div>
                <span className="shrink-0 text-xs capitalize text-zinc-400">{channel.health ?? "no player"}</span>
              </label>
            ))
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
