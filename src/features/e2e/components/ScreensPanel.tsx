"use client";

import { useState } from "react";
import type { LogEntry, Screen } from "../types";
import { callApi } from "../services/e2e-api";

type ScreensPanelProps = {
  onLog: (entry: LogEntry) => void;
  screens: Screen[];
  onScreensChange: (screens: Screen[]) => void;
  selectedScreenIds: string[];
  onSelectedScreenIdsChange: (ids: string[]) => void;
};

export function ScreensPanel({
  onLog,
  screens,
  onScreensChange,
  selectedScreenIds,
  onSelectedScreenIdsChange,
}: ScreensPanelProps) {
  const [detailJson, setDetailJson] = useState<string | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    const { entry, data } = await callApi<Screen[]>({
      method: "GET",
      path: "/media/screens",
    });
    onLog(entry);
    if (data && Array.isArray(data)) {
      onScreensChange(data);
    }
    setLoading(false);
  };

  const handleToggleScreen = (id: string) => {
    if (selectedScreenIds.includes(id)) {
      onSelectedScreenIdsChange(selectedScreenIds.filter((item) => item !== id));
    } else {
      onSelectedScreenIdsChange([...selectedScreenIds, id]);
    }
  };

  const handleViewDetail = async (id: string) => {
    setSelectedScreenId(id);
    const { entry, data } = await callApi<unknown>({
      method: "GET",
      path: `/media/screens/${id}`,
    });
    onLog(entry);
    setDetailJson(JSON.stringify(data ?? entry.response, null, 2));
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          2. Screens Panel ({selectedScreenIds.length} selected)
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh Screens
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
              <th className="py-2 px-1 w-8">Select</th>
              <th className="py-2 px-1">Name</th>
              <th className="py-2 px-1">ID</th>
              <th className="py-2 px-1">Status</th>
              <th className="py-2 px-1 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {screens.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-zinc-400">
                  No screens loaded. Click Refresh Screens.
                </td>
              </tr>
            ) : (
              screens.map((screen) => {
                const isSelected = selectedScreenIds.includes(screen.id);
                const statusLevel = screen.status_level;
                const isOnline = Boolean(screen.is_online);

                let badgeColor = "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
                let badgeText = "Offline";

                if (statusLevel) {
                  if (statusLevel === "online") {
                    badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                    badgeText = "Online";
                  } else if (statusLevel === "warning") {
                    badgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
                    badgeText = "Warning";
                  } else {
                    badgeColor = "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
                    badgeText = "Offline";
                  }
                } else if (isOnline) {
                  badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                  badgeText = "Online";
                }

                return (
                  <tr
                    key={screen.id}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className="py-2 px-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleScreen(screen.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-2 px-1 font-medium text-zinc-800 dark:text-zinc-200">
                      {screen.name ?? screen.id}
                    </td>
                    <td className="py-2 px-1 font-mono text-[11px] text-zinc-500">
                      {screen.id}
                    </td>
                    <td className="py-2 px-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </td>
                    <td className="py-2 px-1 text-right">
                      <button
                        onClick={() => handleViewDetail(screen.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {detailJson && (
        <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Screen Detail ({selectedScreenId}):
            </span>
            <button
              onClick={() => setDetailJson(null)}
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-[11px]"
            >
              Close
            </button>
          </div>
          <pre className="overflow-x-auto max-h-48 font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
            {detailJson}
          </pre>
        </div>
      )}
    </div>
  );
}
