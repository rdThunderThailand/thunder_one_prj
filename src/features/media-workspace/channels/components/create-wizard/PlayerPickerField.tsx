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
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
    >
      <MonitorIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{candidate.name}</span>
          <Badge color={candidate.health === "online" ? "green" : "zinc"}>
            {candidate.health[0]!.toUpperCase() + candidate.health.slice(1)}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[candidate.model, candidate.location?.name].filter(Boolean).join(" · ") || candidate.code}
        </p>
        {reason && <p className="mt-0.5 text-xs text-danger">Unavailable — {reason}</p>}
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
          className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <MonitorIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={`flex-1 truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
            {selected ? selected.name : "Select a player"}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
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
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-96 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg">
            <div className="relative mb-2">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search player by name, location, or ID..."
                className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-ring"
              />
            </div>

            <p className="px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Available players ({available.length})
            </p>
            {available.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No available players</p>}
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
                <p className="mt-2 px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unavailable players ({unavailable.length})
                </p>
                {unavailable.map((candidate) => (
                  <CandidateRow key={candidate.id} candidate={candidate} disabled onSelect={() => {}} />
                ))}
              </>
            )}

            <p className="mt-2 border-t border-border px-3 pt-2 text-xs text-muted-foreground">
              Can&apos;t find your player? Set up a new player by installing ThunderOne Player.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
