"use client";

import { useCallback, useEffect, useState } from "react";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchContentFolders } from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";
import { fetchPlaylists } from "./services/playlists-api";
import { filterTrashedPlaylists } from "./folder-filtering";
import type { PlaylistListItem } from "./types";

const FAIL = "โหลด playlists ไม่สำเร็จ";

/** Owns every fetch behind the playlists list: the active dataset, the folder tree,
 *  campaign names, and — lazily, only once the rail's Trash view is opened — the
 *  soft-deleted dataset. `reload` refreshes whatever is currently loaded. */
export function usePlaylistsListData(showTrash: boolean) {
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [trashed, setTrashed] = useState<PlaylistListItem[] | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadActive = useCallback(async () => {
    const rows = await fetchPlaylists(true);
    setPlaylists(rows);
    return rows;
  }, []);
  const loadTrashed = useCallback(
    async (freshActive?: PlaylistListItem[]) => {
      const active = freshActive ?? playlists ?? await fetchPlaylists(true);
      if (playlists === null) setPlaylists(active);
      const rows = await fetchPlaylists(true, true);
      setTrashed(filterTrashedPlaylists(rows, active));
    },
    [playlists]
  );
  const loadFolders = useCallback(
    () => fetchContentFolders("playlist").then(setFolders).catch(() => setFolders([])),
    []
  );

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => loadActive()).catch((err) => alive && setError(classifyApiError(err, FAIL)));
    void Promise.resolve().then(() => loadFolders());
    return () => { alive = false; };
  }, [loadActive, loadFolders]);

  useEffect(() => {
    if (!showTrash || trashed !== null) return;
    let alive = true;
    Promise.resolve().then(() => loadTrashed()).catch((err) => alive && setError(classifyApiError(err, FAIL)));
    return () => { alive = false; };
  }, [showTrash, trashed, loadTrashed]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const active = await loadActive();
      await Promise.all([loadFolders(), trashed !== null ? loadTrashed(active) : null]);
      setError(null);
    } catch (err) {
      setError(classifyApiError(err, FAIL));
    } finally {
      setRefreshing(false);
    }
  }, [loadActive, loadFolders, loadTrashed, trashed]);

  return { playlists, trashed, folders, error, refreshing, reload };
}
