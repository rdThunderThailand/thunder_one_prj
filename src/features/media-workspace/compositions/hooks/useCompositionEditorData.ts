"use client";

// Everything the merged editor needs that is not the Composition itself: the tenant's
// Templates, media assets, Playlists, folders, and the preview URLs and per-Playlist detail
// the canvas draws from.
//
// Split out of CompositionEditorPage by ticket 25. It is a loader, not a policy — nothing in
// here knows about saving, geometry or bindings.

import { useEffect, useMemo, useState } from "react";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchContentFolders, fetchMediaAssets, fetchPreviewUrls } from "@/lib/api/media-api";
import { fetchLayouts } from "@/features/media-workspace/layouts/services/layouts-api";
import type { LayoutListItem } from "@/features/media-workspace/layouts/types";
import { decodeMetadata, fetchPlaylist, fetchPlaylists } from "@/features/media-workspace/playlists";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import type { PlaylistPreviewPlayback } from "@/features/media-workspace/preview/playlist-preview";
import type { ContentFolder, MediaAsset, PlaylistItem } from "@/types/domain";
import { firstPlaylistAssetId } from "../content-preview";

/** What one Playlist contributes to the editor once its detail has been read. */
export type PlaylistDetailSlice = {
  playlistId: string;
  firstAssetId?: string;
  items?: PlaylistItem[];
  playback?: PlaylistPreviewPlayback;
};

export function useCompositionEditorData() {
  const [layouts, setLayouts] = useState<LayoutListItem[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [playlistDurations, setPlaylistDurations] = useState<Record<string, number | undefined>>({});
  const [previews, setPreviews] = useState<Record<string, string | undefined>>({});
  const [previewThumbnails, setPreviewThumbnails] = useState<Record<string, string | undefined>>({});
  const [playlistPreviewAssetIds, setPlaylistPreviewAssetIds] = useState<Record<string, string>>({});
  const [playlistItemsById, setPlaylistItemsById] = useState<Record<string, PlaylistItem[]>>({});
  /** ADR 0062 §7: `default_transition`/`transition_duration`/`media_fit` for the preview come
   *  from the bound Playlist, never the Zone binding. */
  const [playlistPlaybackById, setPlaylistPlaybackById] = useState<Record<string, PlaylistPreviewPlayback>>({});
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);

  const absorbPlaylistDetails = (slices: readonly (PlaylistDetailSlice | null)[]) => {
    const present = slices.filter((slice): slice is PlaylistDetailSlice => slice !== null);
    setPlaylistPreviewAssetIds((current) => ({
      ...current,
      ...Object.fromEntries(present.flatMap((s) => (s.firstAssetId ? [[s.playlistId, s.firstAssetId]] : []))),
    }));
    setPlaylistItemsById((current) => ({
      ...current,
      ...Object.fromEntries(present.flatMap((s) => (s.items ? [[s.playlistId, s.items]] : []))),
    }));
    setPlaylistPlaybackById((current) => ({
      ...current,
      ...Object.fromEntries(present.flatMap((s) => (s.playback ? [[s.playlistId, s.playback]] : []))),
    }));
  };

  /** Reads one Playlist and folds it into the three maps. Used when a Zone is newly bound. */
  const hydratePlaylist = (playlistId: string) => {
    void fetchPlaylist(playlistId)
      .then((detail) => absorbPlaylistDetails([{
        playlistId,
        firstAssetId: firstPlaylistAssetId(detail.items),
        items: detail.items,
        playback: decodeMetadata(detail.metadata).playback,
      }]))
      .catch(() => undefined);
  };

  useEffect(() => {
    let alive = true;
    Promise.all([fetchLayouts(), fetchMediaAssets().catch(() => []), fetchPlaylists(), fetchContentFolders("composition").catch(() => [])])
      .then(([allLayouts, allAssets, allPlaylists, allFolders]) => {
        if (!alive) return;
        setLayouts(allLayouts.filter((layout) => layout.status === "active"));
        setAssets(allAssets);
        setPlaylists(allPlaylists);
        setFolders(allFolders);
        setPlaylistDurations(Object.fromEntries(allPlaylists.map((p) => [p.id, p.total_duration_seconds] as const)));
        // An explicit cover wins immediately; the per-Playlist reads below fill in the rest.
        setPlaylistPreviewAssetIds((current) => ({
          ...current,
          ...Object.fromEntries(allPlaylists.flatMap((playlist) => {
            const assetId = playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;
            return assetId ? [[playlist.id, assetId]] : [];
          })),
        }));
        return Promise.all(allPlaylists.map(async (playlist): Promise<PlaylistDetailSlice | null> => {
          try {
            const detail = await fetchPlaylist(playlist.id);
            return {
              playlistId: playlist.id,
              firstAssetId: firstPlaylistAssetId(detail.items),
              items: detail.items,
              playback: decodeMetadata(detail.metadata).playback,
            };
          } catch {
            return null;
          }
        }));
      })
      .then((slices) => {
        if (alive && slices) absorbPlaylistDetails(slices);
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลดข้อมูลไม่สำเร็จ")));
    return () => {
      alive = false;
    };
  }, []);

  const previewIds = useMemo(() => assets.map((asset) => asset.id), [assets]);
  useEffect(() => {
    if (previewIds.length === 0) return;
    let alive = true;
    void fetchPreviewUrls(previewIds).then((map) => {
      if (!alive) return;
      setPreviews((prev) => ({ ...prev, ...map.urls }));
      setPreviewThumbnails((prev) => ({ ...prev, ...map.thumbnailUrls }));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIds.join(",")]);

  return {
    layouts, setLayouts,
    assets, playlists, folders,
    playlistDurations, previews, previewThumbnails,
    playlistPreviewAssetIds, playlistItemsById, playlistPlaybackById,
    absorbPlaylistDetails, hydratePlaylist,
    loadError,
  };
}
