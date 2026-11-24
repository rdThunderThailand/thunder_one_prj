"use client";

import { useState } from "react";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";
import { playlistItemToPreview, playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import { decodeMetadata } from "./metadata";
import { fetchPlaylist } from "./services/playlists-api";

export type PlaylistListPreview = { id: string; preview: StagePreview; assets: MediaAsset[] };

/** The list page's Preview action: load the saved Playlist and open it in the preview sheet,
 *  the same way the Compositions list does — no navigation. */
export function usePlaylistListPreview(onError: (reason: unknown) => void) {
  const [current, setCurrent] = useState<PlaylistListPreview | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = async (id: string) => {
    setBusyId(id);
    try {
      const [playlist, allAssets] = await Promise.all([fetchPlaylist(id), fetchMediaAssets()]);
      const { playback } = decodeMetadata(playlist.metadata);
      const preview = playlistPreviewStage({ name: playlist.name, items: playlist.items.map(playlistItemToPreview), playback });
      const referenced = new Set(playlist.items.map((item) => item.media_asset_id));
      setCurrent({ id, preview, assets: allAssets.filter((asset) => referenced.has(asset.id)) });
    } catch (reason) {
      onError(reason);
    } finally {
      setBusyId(null);
    }
  };

  return { current, busyId, open, close: () => setCurrent(null) };
}
