"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SearchIcon } from "@/components/ui/icons";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { fetchPlaylists } from "@/features/playlists";
import type { PlaylistListItem } from "@/features/playlists";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";

export function PlaylistPickerStep() {
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const setPlaylistId = usePublicationDraftStore((s) => s.setPlaylistId);

  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ponytail: promise chain, not async/await — react-hooks/set-state-in-effect follows an
  // async callee into its body and flags the setState calls even though they're post-await.
  const loadPlaylists = useCallback(
    () =>
      fetchPlaylists()
        .then((data) => {
          setPlaylists(data);
          setError(null);
        })
        .catch((err) => {
          setPlaylists([]);
          setError(err instanceof Error ? err.message : "Failed to load playlists");
        })
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    void loadPlaylists();
  }, [loadPlaylists]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase();
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, searchQuery]);

  const coverIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of filtered) {
      if (p.cover_asset_id) ids.push(p.cover_asset_id);
    }
    return ids;
  }, [filtered]);

  const previews = usePreviewUrls(coverIds);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playlists..."
              className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <Link
            href="/playlists/create"
            target="_blank"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            สร้าง Playlist ใหม่
          </Link>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-zinc-900">Select Playlist</h2>
        </div>
        <p className={`mb-3 text-xs ${error ? "text-red-500" : "text-zinc-400"}`}>
          {loading
            ? "Loading playlists…"
            : error
              ? error
              : `${filtered.length} playlists found`}
        </p>

        <div className="flex flex-col gap-2">
          {filtered.map((playlist) => {
            const isSelected = playlistId === playlist.id;
            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => setPlaylistId(isSelected ? null : playlist.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  <MediaThumb
                    url={playlist.cover_asset_id ? previews[playlist.cover_asset_id] : undefined}
                    alt={playlist.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${isSelected ? "text-indigo-900" : "text-zinc-900"}`}>
                    {playlist.name}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {playlist.item_count} items · {playlist.status === "active" ? "Active" : "Inactive"}
                  </p>
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
                      <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
