"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SearchIcon } from "@/components/ui/icons";
import { classifyApiError } from "@/lib/api/api-error";
import { fetchChannelGroupOptions, isChannelGroupSyncConflict, setChannelGroups } from "../services/channels-api";
import type { ChannelDetail, ChannelGroupSummary, ChannelListItem } from "../types";

/** D9: search + checklist, replace-the-whole-set on Save (same convention as D16's members PUT). */
export function ChannelGroupsPickerModal({
  channel,
  onClose,
  onSaved,
}: {
  channel: ChannelListItem;
  onClose: () => void;
  onSaved: (updated: ChannelDetail) => void;
}) {
  const [options, setOptions] = useState<ChannelGroupSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set((channel.groups ?? []).map((g) => g.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChannelGroupOptions()
      .then((groups) => alive && setOptions(groups))
      .catch((caught) => alive && setLoadError(classifyApiError(caught, "Could not load Channel Groups.").message));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = options ?? [];
    if (q === "") return list;
    return list.filter((g) => g.name.toLowerCase().includes(q));
  }, [options, search]);

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
      onSaved(await setChannelGroups(channel.id, Array.from(checked)));
    } catch (caught) {
      if (caught instanceof Error && isChannelGroupSyncConflict(caught.message)) {
        setError("A channel can only belong to one synchronized Group at a time. Remove it from the other Group first.");
      } else {
        setError(classifyApiError(caught, "Could not update this channel's Groups. Try again.").message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Manage Groups"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={saving || options === null} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Select the channel groups for <span className="font-medium text-zinc-800 dark:text-zinc-200">{channel.name}</span>.
        </p>

        <div className="flex items-center justify-between gap-3">
          <label className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search groups…"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{checked.size} selected</span>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-zinc-100 dark:border-zinc-800">
          {options === null ? (
            <p className="p-4 text-sm text-zinc-400">{loadError ?? "Loading channel groups…"}</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">No channel groups match your search.</p>
          ) : (
            filtered.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-center gap-3 border-b border-zinc-100 px-3 py-2.5 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  checked={checked.has(group.id)}
                  onChange={() => toggle(group.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{group.name}</p>
                </div>
                <span className="shrink-0 text-xs capitalize text-zinc-400">{group.playback_mode}</span>
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
