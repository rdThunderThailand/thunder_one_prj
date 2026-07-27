"use client";

import { useMemo, useState } from "react";
import type { PublicationTarget, Screen } from "../types";

type ChannelsStepProps = {
  targets: PublicationTarget[];
  onChange: (targets: PublicationTarget[]) => void;
  screens: Screen[];
  loadingScreens: boolean;
  screensError: string | null;
};

const STATUS_FILTERS = ["all", "online", "warning", "offline"] as const;

const STATUS_STYLES: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  offline: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// ponytail: device targets only. media_core.channels has no list RPC and no rows
// yet, so channel grouping (and the reach/status widgets in the design, which
// have no data source) are left out until channels actually exist.
export function ChannelsStep({
  targets,
  onChange,
  screens,
  loadingScreens,
  screensError,
}: ChannelsStepProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("all");

  const selectedIds = useMemo(
    () => new Set(targets.map((t) => t.device_id).filter(Boolean)),
    [targets]
  );

  const screenMap = useMemo(() => {
    const map = new Map<string, Screen>();
    screens.forEach((s) => map.set(s.id, s));
    return map;
  }, [screens]);

  const filteredScreens = useMemo(() => {
    const query = search.trim().toLowerCase();
    return screens.filter((screen) => {
      const matchStatus =
        statusFilter === "all" || screen.status_level === statusFilter;
      return matchStatus && (!query || screen.name.toLowerCase().includes(query));
    });
  }, [screens, search, statusFilter]);

  const handleToggle = (screen: Screen) => {
    if (selectedIds.has(screen.id)) {
      onChange(targets.filter((t) => t.device_id !== screen.id));
    } else {
      onChange([
        ...targets,
        { target_type: "device", device_id: screen.id, name: screen.name },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {screensError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{screensError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Screens</h3>
            <span className="text-xs text-zinc-500">{filteredScreens.length} screens</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" placeholder="Search screens..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <div className="flex rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden text-xs">
              {STATUS_FILTERS.map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 capitalize font-medium ${statusFilter === s ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loadingScreens ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Loading screens…</p>
          ) : filteredScreens.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No screens found.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredScreens.map((screen) => {
                const isSelected = selectedIds.has(screen.id);
                const status = screen.status_level ?? "offline";

                return (
                  <div key={screen.id} onClick={() => handleToggle(screen)} className={`rounded border p-3 text-xs cursor-pointer transition-colors ${isSelected ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{screen.name}</div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_STYLES[status]}`}>{status}</span>
                        {isSelected && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Selected</span>}
                      </div>
                    </div>
                    {screen.last_heartbeat_at && (
                      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Last seen {new Date(screen.last_heartbeat_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Selected Channels ({targets.length})</h3>
            {targets.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                Clear all
              </button>
            )}
          </div>

          {targets.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
              Select at least one screen from the list on the left.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {targets.map((target) => {
                const id = target.device_id ?? target.channel_id ?? "";
                const name = screenMap.get(id)?.name ?? target.name ?? id;

                return (
                  <div key={id} className="flex items-center justify-between gap-3 rounded border border-zinc-200 p-2 text-xs dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{name}</span>
                    <button type="button" onClick={() => onChange(targets.filter((t) => (t.device_id ?? t.channel_id) !== id))} className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 shrink-0">
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
