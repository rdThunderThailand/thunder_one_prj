"use client";

import { useCallback, useEffect, useState } from "react";
import type { LogEntry, Publication } from "../types";
import { callApi } from "../services/e2e-api";

type PublishPanelProps = {
  onLog: (entry: LogEntry) => void;
  lastPlaylistId: string | null;
  selectedScreenIds: string[];
  lastPublicationId: string | null;
  onLastPublicationIdChange: (id: string | null) => void;
};

export function PublishPanel({
  onLog,
  lastPlaylistId,
  selectedScreenIds,
  lastPublicationId,
  onLastPublicationIdChange,
}: PublishPanelProps) {
  const [publication, setPublication] = useState<Publication | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRefreshStatus = useCallback(async () => {
    if (!lastPublicationId) return;
    setLoading(true);
    const { entry, data } = await callApi<Publication>({
      method: "GET",
      path: `/media/publications/${lastPublicationId}`,
    });
    onLog(entry);
    if (data) {
      setPublication(data);
    }
    setLoading(false);
  }, [lastPublicationId, onLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && lastPublicationId) {
      interval = setInterval(() => {
        handleRefreshStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, lastPublicationId, handleRefreshStatus]);

  const handlePublish = async () => {
    if (!lastPlaylistId || selectedScreenIds.length === 0) return;
    setLoading(true);
    const targets = selectedScreenIds.map((id) => ({
      target_type: "device" as const,
      device_id: id,
    }));

    const { entry, data } = await callApi<Publication>({
      method: "POST",
      path: "/media/publish",
      body: {
        playlist_id: lastPlaylistId,
        targets,
      },
    });
    onLog(entry);

    if (data && data.id) {
      onLastPublicationIdChange(data.id);
      setPublication(data);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          4. Publish Panel
        </h2>
        <button
          onClick={handlePublish}
          disabled={loading || !lastPlaylistId || selectedScreenIds.length === 0}
          className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Publish Playlist
        </button>
      </div>

      <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
        <div>
          Active Playlist ID:{" "}
          <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
            {lastPlaylistId ?? "None selected"}
          </span>
        </div>
        <div>
          Selected Screens Count:{" "}
          <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
            {selectedScreenIds.length}
          </span>
        </div>
        <div>
          Last Publication ID:{" "}
          <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
            {lastPublicationId ?? "None"}
          </span>
        </div>
      </div>

      {lastPublicationId && (
        <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Publication Details
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto refresh 5s
              </label>
              <button
                onClick={handleRefreshStatus}
                disabled={loading}
                className="rounded border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {publication?.targets && publication.targets.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-1 px-1">Device ID</th>
                  <th className="py-1 px-1">Type</th>
                  <th className="py-1 px-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {publication.targets.map((target, idx) => (
                  <tr
                    key={`${target.device_id ?? idx}`}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    <td className="py-1.5 px-1 font-mono text-zinc-800 dark:text-zinc-200">
                      {target.device_id ?? target.channel_id ?? "N/A"}
                    </td>
                    <td className="py-1.5 px-1 text-zinc-500">
                      {target.target_type ?? "device"}
                    </td>
                    <td className="py-1.5 px-1 font-medium text-indigo-600 dark:text-indigo-400">
                      {target.status ?? publication.status ?? "pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-2 text-center text-xs text-zinc-400">
              No target details returned yet. Click Refresh.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
