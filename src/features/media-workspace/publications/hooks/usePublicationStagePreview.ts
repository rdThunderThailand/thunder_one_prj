"use client";

import { useEffect, useMemo, useState } from "react";
import { loadCompositionPreview, type StagePreview } from "@/features/media-workspace/preview/composition-preview";
import { playlistItemToPreview, playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

export type PreviewBranch = "media" | "playlist" | "composition";

// Loose media has no geometry of its own (ADR 0061 §5) — the preview frame defaults to 16:9.
const LOOSE_MEDIA_ASPECT = "16:9";

/**
 * Projects the wizard draft onto the single StagePreview shape all three preview surfaces read
 * (ADR 0061 §1). Loose media resolves synchronously off the draft; the Playlist and Composition
 * branches fetch their record. Keyed by branch identity so a stale response never paints once
 * the operator has picked a different Playlist/Layout.
 *
 * Shared by the Prepare Content frame (inline stage + Content Info rail) and the
 * "Preview playback" button so the record is fetched once.
 */
export function usePublicationStagePreview(enabled = true) {
  const publicationType = usePublicationDraftStore((s) => s.basicInfo.publicationType);
  const name = usePublicationDraftStore((s) => s.basicInfo.name);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);

  const branch: PreviewBranch =
    publicationType === "composition" ? "composition" : publicationType === "playlist" ? "playlist" : "media";

  const assetKey = assetItems.map((i) => `${i.media_asset_id}:${i.duration_seconds ?? ""}:${i.transition ?? ""}`).join(",");
  const key = branch === "composition" ? compositionId : branch === "playlist" ? playlistId : assetKey;
  const hasContent = branch === "media" ? assetItems.length > 0 : Boolean(key);

  const [state, setState] = useState<
    { key: string; preview: StagePreview } | { key: string; error: true } | null
  >(null);

  const localPreview = useMemo<StagePreview | null>(() => {
    if (!enabled || branch !== "media" || assetItems.length === 0) return null;
    return {
      zones: [
        {
          id: "publication-assets",
          name: name || "Publication",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          items: assetItems.map((item) => ({
            mediaAssetId: item.media_asset_id,
            durationSeconds: item.duration_seconds,
            transition: item.transition,
          })),
        },
      ],
      aspectRatio: LOOSE_MEDIA_ASPECT,
      referenceResolution: null,
    };
    // `name` only labels the corner badge — cheap to recompute, no refetch.
  }, [enabled, branch, name, assetItems]);

  useEffect(() => {
    if (!enabled || branch === "media" || !key) return;
    let alive = true;
    const load =
      branch === "composition"
        ? loadCompositionPreview(key)
        : fetchPlaylist(key).then((playlist) =>
            playlistPreviewStage({
              name: playlist.name,
              items: playlist.items.map(playlistItemToPreview),
              playback: decodeMetadata(playlist.metadata).playback,
            }),
          );
    load
      .then((preview) => alive && setState({ key, preview }))
      .catch(() => alive && setState({ key, error: true }));
    return () => {
      alive = false;
    };
  }, [enabled, branch, key]);

  const current = state?.key === key ? state : null;
  const preview = branch === "media" ? localPreview : current && "preview" in current ? current.preview : null;
  const error = Boolean(current && "error" in current);
  // No `loading` state: on the fetched branches we are loading whenever the keyed response
  // has not arrived yet.
  const loading = enabled && branch !== "media" && hasContent && current === null;

  return { preview, loading, error, hasContent, branch } as const;
}
