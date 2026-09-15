"use client";

import { useState } from "react";
import { ChevronDownIcon, MonitorIcon, RepeatIcon, SearchIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { filterPlayerCandidates, partitionPlayerCandidates, unavailableReason, type ChannelPlayerCandidate } from "../../player-candidates";

function CandidateRow({
  candidate,
  disabled,
  excludeChannelId,
  onSelect,
}: {
  candidate: ChannelPlayerCandidate;
  disabled: boolean;
  excludeChannelId?: string;
  onSelect: () => void;
}) {
  const reason = unavailableReason(candidate, excludeChannelId);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:hover:bg-zinc-800"
    >
      <MonitorIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{candidate.name}</span>
          <Badge color={candidate.health === "online" ? "green" : "zinc"}>
            {candidate.health[0]!.toUpperCase() + candidate.health.slice(1)}
          </Badge>
        </div>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {[candidate.model, candidate.location?.name].filter(Boolean).join(" · ") || candidate.code}
        </p>
        {reason && <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">Unavailable — {reason}</p>}
      </div>
    </button>
  );
}

export function PlayerPickerField({
  candidates,
  selectedId,
  loading,
  excludeChannelId,
  onSelect,
  onRefresh,
}: {
  candidates: ChannelPlayerCandidate[];
  selectedId: string | null;
  loading: boolean;
  /** The edit page's own Channel — its current Player reads as available, not "in use". Omit on
   *  the create wizard, where every reservation belongs to some other Channel. */
  excludeChannelId?: string;
  onSelect: (candidate: ChannelPlayerCandidate) => void;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const { available, unavailable } = partitionPlayerCandidates(filterPlayerCandidates(candidates, search), excludeChannelId);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-left text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <MonitorIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className={`flex-1 truncate ${selected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}>
            {selected ? selected.name : "Select a player"}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RepeatIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-96 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="relative mb-2">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search player by name, location, or ID..."
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>

            <p className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Available players ({available.length})
            </p>
            {available.length === 0 && <p className="px-3 py-2 text-sm text-zinc-400">No available players</p>}
            {available.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                disabled={false}
                excludeChannelId={excludeChannelId}
                onSelect={() => {
                  onSelect(candidate);
                  setOpen(false);
                }}
              />
            ))}

            {unavailable.length > 0 && (
              <>
                <p className="mt-2 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Unavailable players ({unavailable.length})
                </p>
                {unavailable.map((candidate) => (
                  <CandidateRow key={candidate.id} candidate={candidate} disabled onSelect={() => {}} />
                ))}
              </>
            )}

            <p className="mt-2 border-t border-zinc-100 px-3 pt-2 text-xs text-zinc-400 dark:border-zinc-800">
              Can&apos;t find your player? Set up a new player by installing ThunderOne Player.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
