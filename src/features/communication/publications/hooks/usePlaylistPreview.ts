"use client";

import { useEffect, useState } from "react";
import {
  decodeMetadata,
  fetchPlaylist,
  formatDuration,
  resolveCoverAssetId,
  totalDurationSeconds,
  type PlaylistDetail,
} from "@/features/communication/playlists";

/**
 * Shared by Step 4 (Schedule) and Step 5 (Review & Publish) — both preview the
 * draft's content, and a playlist publication has no `assetItems` to read (it's
 * one `playlistId`, resolved here into a cover, name and total duration).
 */
export function usePlaylistPreview(playlistId: string | null, enabled: boolean) {
  // Keyed by playlist id so a stale response for a previously-selected playlist
  // never renders once the operator has picked a different one.
  const [result, setResult] = useState<
    { id: string; detail: PlaylistDetail } | { id: string; failed: true } | null
  >(null);

  useEffect(() => {
    if (!enabled || !playlistId) return;
    let alive = true;
    fetchPlaylist(playlistId)
      .then((detail) => alive && setResult({ id: playlistId, detail }))
      .catch(() => alive && setResult({ id: playlistId, failed: true }));
    return () => {
      alive = false;
    };
  }, [enabled, playlistId]);

  const current = result?.id === playlistId ? result : null;
  const playlist = current && "detail" in current ? current.detail : null;
  const failed = current ? "failed" in current : false;

  const metadata = decodeMetadata(playlist?.metadata);
  const coverAssetId = playlist
    ? resolveCoverAssetId(metadata.info.coverAssetId, playlist.items)
    : undefined;
  const durationLabel = playlist
    ? formatDuration(
        totalDurationSeconds(
          playlist.items.map((i) => ({ mediaAssetId: i.media_asset_id, durationSeconds: i.duration_seconds ?? null }))
        )
      )
    : undefined;

  return { playlist, failed, coverAssetId, durationLabel };
}
