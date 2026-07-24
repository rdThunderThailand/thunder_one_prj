"use client";

import { useCallback, useEffect, useState } from "react";
import type { LogEntry, Publication, Video } from "../types";
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
  const [publicationName, setPublicationName] = useState("");
  const [draftPublicationId, setDraftPublicationId] = useState<string | null>(null);
  const [videosList, setVideosList] = useState<Video[]>([]);
  const [selectedSingleVideoId, setSelectedSingleVideoId] = useState("");

  const handleRefreshStatus = useCallback(async () => {
    const targetId = lastPublicationId ?? draftPublicationId;
    if (!targetId) return;
    setLoading(true);
    const { entry, data } = await callApi<Publication>({
      method: "GET",
      path: `/media/publications/${targetId}`,
    });
    onLog(entry);
    if (data) setPublication(data);
    setLoading(false);
  }, [lastPublicationId, draftPublicationId, onLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && (lastPublicationId || draftPublicationId)) {
      interval = setInterval(() => { handleRefreshStatus(); }, 5000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [autoRefresh, lastPublicationId, draftPublicationId, handleRefreshStatus]);

  const loadVideosList = async () => {
    const { entry, data } = await callApi<Video[]>({ method: "GET", path: "/media/videos" });
    onLog(entry);
    if (data && Array.isArray(data)) setVideosList(data);
  };

  const handlePublish = async () => {
    if (!lastPlaylistId || selectedScreenIds.length === 0) return;
    setLoading(true);
    const targets = selectedScreenIds.map((id) => ({ target_type: "device" as const, device_id: id }));
    const { entry, data } = await callApi<Publication>({
      method: "POST",
      path: "/media/publish",
      body: { playlist_id: lastPlaylistId, targets },
    });
    onLog(entry);
    if (data && data.id) {
      onLastPublicationIdChange(data.id);
      setPublication(data);
    }
    setLoading(false);
  };

  const handleCreateDraft = async () => {
    if (!lastPlaylistId || selectedScreenIds.length === 0) return alert("Please select a playlist and at least one screen");
    if (!publicationName.trim()) return alert("Please enter a publication name");
    setLoading(true);
    const targets = selectedScreenIds.map((id) => ({ target_type: "device" as const, device_id: id }));
    const { entry, data } = await callApi<{ publication_id?: string; id?: string }>({
      method: "POST",
      path: "/media/publications",
      body: { playlist_id: lastPlaylistId, name: publicationName.trim(), targets },
    });
    onLog(entry);
    const pubId = data?.publication_id ?? data?.id ?? null;
    if (pubId) {
      setDraftPublicationId(pubId);
      onLastPublicationIdChange(pubId);
    }
    setLoading(false);
  };

  const handleActivateDraft = async () => {
    const pubId = draftPublicationId ?? lastPublicationId;
    if (!pubId) return alert("No draft publication available to activate");
    setLoading(true);
    const { entry } = await callApi<unknown>({ method: "POST", path: `/media/publications/${pubId}/activate` });
    onLog(entry);
    await handleRefreshStatus();
    setLoading(false);
  };

  const handlePublishSingle = async () => {
    if (!selectedSingleVideoId || selectedScreenIds.length === 0) return alert("Please select a video asset and at least one screen");
    setLoading(true);
    const targets = selectedScreenIds.map((id) => ({ target_type: "device" as const, device_id: id }));
    const { entry, data } = await callApi<{ publication_id?: string; id?: string }>({
      method: "POST",
      path: "/media/publish-single",
      body: { media_asset_id: selectedSingleVideoId, targets },
    });
    onLog(entry);
    const pubId = data?.publication_id ?? data?.id ?? null;
    if (pubId) {
      onLastPublicationIdChange(pubId);
      setDraftPublicationId(pubId);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">4. Publish Panel</h2>
        <button onClick={handlePublish} disabled={loading || !lastPlaylistId || selectedScreenIds.length === 0} className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50">
          Publish Playlist
        </button>
      </div>

      <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
        <div>Active Playlist ID: <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{lastPlaylistId ?? "None selected"}</span></div>
        <div>Selected Screens Count: <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{selectedScreenIds.length}</span></div>
        <div>Last Publication ID: <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{lastPublicationId ?? draftPublicationId ?? "None"}</span></div>
      </div>

      <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3 text-xs">
        <div className="font-semibold text-zinc-700 dark:text-zinc-300">Draft & Activate Publication Flow</div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={publicationName}
            onChange={(e) => setPublicationName(e.target.value)}
            placeholder="Publication name..."
            className="flex-1 min-w-[140px] rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button onClick={handleCreateDraft} disabled={loading || !lastPlaylistId || selectedScreenIds.length === 0} className="rounded bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Create draft
          </button>
          <button onClick={handleActivateDraft} disabled={loading || (!draftPublicationId && !lastPublicationId)} className="rounded bg-emerald-600 px-3 py-1 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            Activate
          </button>
        </div>

        <div className="font-semibold text-zinc-700 dark:text-zinc-300 mt-1">Publish Single Media Asset</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSingleVideoId}
            onFocus={loadVideosList}
            onChange={(e) => setSelectedSingleVideoId(e.target.value)}
            className="flex-1 min-w-[140px] rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select video for single publish...</option>
            {videosList.map((v) => (
              <option key={v.id} value={v.id}>{v.title ?? v.name ?? v.id}</option>
            ))}
          </select>
          <button onClick={handlePublishSingle} disabled={loading || !selectedSingleVideoId || selectedScreenIds.length === 0} className="rounded bg-indigo-600 px-3 py-1 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Publish single
          </button>
        </div>
      </div>

      {(lastPublicationId || draftPublicationId) && (
        <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Publication Details</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded" />
                Auto refresh 5s
              </label>
              <button onClick={handleRefreshStatus} disabled={loading} className="rounded border border-zinc-300 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50">
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
                  <tr key={`${target.device_id ?? idx}`} className="border-b border-zinc-100 dark:border-zinc-800/50">
                    <td className="py-1.5 px-1 font-mono text-zinc-800 dark:text-zinc-200">{target.device_id ?? target.channel_id ?? "N/A"}</td>
                    <td className="py-1.5 px-1 text-zinc-500">{target.target_type ?? "device"}</td>
                    <td className="py-1.5 px-1 font-medium text-indigo-600 dark:text-indigo-400">{target.status ?? publication.status ?? "pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-2 text-center text-xs text-zinc-400">No target details returned yet. Click Refresh.</div>
          )}
        </div>
      )}
    </div>
  );
}
