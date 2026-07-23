"use client";

import { useState } from "react";
import type { LogEntry, Playlist, PlaylistItem, Video } from "../types";
import { callApi } from "../services/e2e-api";

type PlaylistsPanelProps = {
  onLog: (entry: LogEntry) => void;
  playlists: Playlist[];
  onPlaylistsChange: (playlists: Playlist[]) => void;
  lastPlaylistId: string | null;
  onLastPlaylistIdChange: (id: string | null) => void;
  videos: Video[];
};

export function PlaylistsPanel({
  onLog,
  playlists,
  onPlaylistsChange,
  lastPlaylistId,
  onLastPlaylistIdChange,
  videos,
}: PlaylistsPanelProps) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [itemDuration, setItemDuration] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    const { entry, data } = await callApi<Playlist[]>({
      method: "GET",
      path: "/media/playlists",
    });
    onLog(entry);
    if (data && Array.isArray(data)) {
      onPlaylistsChange(data);
      if (!lastPlaylistId && data.length > 0) {
        onLastPlaylistIdChange(data[0].id);
        if (data[0].items) {
          setItems(data[0].items);
        }
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    setLoading(true);
    const { entry, data } = await callApi<Playlist>({
      method: "POST",
      path: "/media/playlists",
      body: { name: newPlaylistName.trim() },
    });
    onLog(entry);
    setNewPlaylistName("");
    if (data && data.id) {
      onLastPlaylistIdChange(data.id);
      setItems([]);
    }
    await handleRefresh();
  };

  const handleSelectPlaylist = (id: string) => {
    onLastPlaylistIdChange(id);
    const found = playlists.find((p) => p.id === id);
    if (found && found.items) {
      setItems(found.items);
    } else {
      setItems([]);
    }
  };

  const handleAddItem = () => {
    if (!selectedVideoId) return;
    const newItem: PlaylistItem = {
      media_asset_id: selectedVideoId,
      position: items.length,
      duration_seconds: itemDuration,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      position: i,
    }));
    setItems(next);
  };

  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((item, i) => ({ ...item, position: i }));
    setItems(reordered);
  };

  const handleSaveItems = async () => {
    if (!lastPlaylistId) return;
    setLoading(true);
    const payloadItems = items.map((item, index) => ({
      media_asset_id: item.media_asset_id,
      position: index,
      duration_seconds: item.duration_seconds ?? 10,
    }));

    const { entry } = await callApi<unknown>({
      method: "PUT",
      path: `/media/playlists/${lastPlaylistId}/items`,
      body: { items: payloadItems },
    });
    onLog(entry);
    await handleRefresh();
  };

  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          3. Playlists Panel
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh Playlists
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded border border-zinc-300 px-2.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          onClick={handleCreate}
          disabled={loading || !newPlaylistName.trim()}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Create
        </button>
      </div>

      {playlists.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Active Playlist:
          </label>
          <select
            value={lastPlaylistId ?? ""}
            onChange={(e) => handleSelectPlaylist(e.target.value)}
            className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? p.id} ({p.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {lastPlaylistId && (
        <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800 flex flex-col gap-3">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Item Builder for Playlist #{lastPlaylistId}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="flex-1 min-w-[150px] rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Select video to add...</option>
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title ?? v.name ?? v.id}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={itemDuration}
              onChange={(e) => setItemDuration(Number(e.target.value))}
              placeholder="Duration (s)"
              className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              onClick={handleAddItem}
              disabled={!selectedVideoId}
              className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Add Item
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {items.length === 0 ? (
              <div className="py-2 text-center text-xs text-zinc-400">
                No items in playlist.
              </div>
            ) : (
              items.map((item, index) => {
                const videoMatch = videos.find((v) => v.id === item.media_asset_id);
                return (
                  <div
                    key={`${item.media_asset_id}-${index}`}
                    className="flex items-center justify-between rounded border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-zinc-500">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {videoMatch?.title ?? videoMatch?.name ?? item.media_asset_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-[11px] text-zinc-500">Secs:</label>
                        <input
                          type="number"
                          value={item.duration_seconds ?? 10}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setItems(
                              items.map((it, i) =>
                                i === index ? { ...it, duration_seconds: val } : it
                              )
                            );
                          }}
                          className="w-14 rounded border border-zinc-300 px-1 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                        />
                      </div>

                      <button
                        onClick={() => handleMoveItem(index, "up")}
                        disabled={index === 0}
                        className="px-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="px-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 font-medium ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={handleSaveItems}
            disabled={loading || items.length === 0}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 mt-1"
          >
            Save Items to Playlist
          </button>
        </div>
      )}
    </div>
  );
}
