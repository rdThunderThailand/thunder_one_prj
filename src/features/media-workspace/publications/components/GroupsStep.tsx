"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { fetchChannelGroups } from "../../channel-groups/services/channel-groups-api";
import type { ChannelGroup } from "../../channel-groups/types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

/** D11 modal A "Channel Groups" tab. `status = 'disabled'` hides a Group from this picker
 *  (ADR 0074 §5) — disabling one does not remove an already-saved selection, only stops new
 *  Publications from targeting it. */
export function GroupsStep() {
  const groupIds = usePublicationDraftStore((s) => s.groupIds);
  const groupNamesById = usePublicationDraftStore((s) => s.groupNamesById);
  const setGroupIds = usePublicationDraftStore((s) => s.setGroupIds);
  const setGroupNamesById = usePublicationDraftStore((s) => s.setGroupNamesById);

  const [groups, setGroups] = useState<ChannelGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    fetchChannelGroups()
      .then((data) => alive && setGroups(data))
      .catch((caught) => alive && setError(caught instanceof Error ? caught.message : "Could not load Channel Groups."));
    return () => {
      alive = false;
    };
  }, []);

  const active = useMemo(() => (groups ?? []).filter((g) => g.status === "active"), [groups]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return active;
    return active.filter((g) => g.name.toLowerCase().includes(q));
  }, [active, search]);

  const toggle = (group: ChannelGroup) => {
    if (groupIds.includes(group.id)) {
      setGroupIds(groupIds.filter((id) => id !== group.id));
    } else {
      setGroupIds([...groupIds, group.id]);
      setGroupNamesById({ ...groupNamesById, [group.id]: group.name });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channel groups..."
          className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {groups === null && <p className="text-xs text-muted-foreground">{error ?? "Loading channel groups..."}</p>}
      {groups !== null && error && <p className="text-xs text-danger">{error}</p>}
      {groups !== null && active.length === 0 && (
        <p className="text-xs text-muted-foreground">No Channel Groups available yet — create one first.</p>
      )}
      {groups !== null && active.length > 0 && filtered.length === 0 && (
        <p className="text-xs text-muted-foreground">No channel groups match your search.</p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((group) => {
          const selected = groupIds.includes(group.id);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggle(group)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected ? "border-primary/30 bg-primary-soft ring-1 ring-primary" : "border-border hover:border-border"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                  selected ? "border-primary bg-primary text-white" : "border-border bg-card"
                }`}
              >
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                    <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.member_count} channels · {group.playback_mode === "synchronized" ? "Synchronized" : "Independent"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
