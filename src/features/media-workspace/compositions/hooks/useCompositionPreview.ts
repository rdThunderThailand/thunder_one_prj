"use client";

// Projects the editor's draft onto the shapes the preview components want: a still per Zone
// for the canvas, a still per Playlist for the picker, the timed Zone list the playback modal
// plays, and the handoff a full-screen preview tab receives over BroadcastChannel.
//
// Split out of CompositionEditorPage by ticket 25 — read-only over the draft, so nothing here
// can change what gets saved.

import { useEffect, useMemo, useRef } from "react";
import type { LayoutListItem } from "@/features/media-workspace/layouts/types";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import type { PlaybackPreviewZone } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { compositionZonePreview, type StagePreview } from "@/features/media-workspace/preview/composition-preview";
import type { PlaylistPreviewPlayback } from "@/features/media-workspace/preview/playlist-preview";
import type { MediaAsset, PlaylistItem } from "@/types/domain";
import type { ZoneBindingDraft } from "../zone-bindings";

type ZonePreview = { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string };

export type CompositionPreviewHandoff = StagePreview & {
  source: "composition";
  id: string;
  assets: MediaAsset[];
};

export function useCompositionPreview({
  compositionId,
  layout,
  bindings,
  assets,
  playlists,
  previews,
  previewThumbnails,
  playlistPreviewAssetIds,
  playlistItemsById,
  playlistPlaybackById,
}: {
  compositionId: string | null;
  layout: Pick<LayoutListItem, "zones" | "aspect_ratio" | "reference_resolution"> | null;
  bindings: ZoneBindingDraft[];
  assets: MediaAsset[];
  playlists: PlaylistListItem[];
  previews: Record<string, string | undefined>;
  previewThumbnails: Record<string, string | undefined>;
  playlistPreviewAssetIds: Record<string, string>;
  playlistItemsById: Record<string, PlaylistItem[]>;
  playlistPlaybackById: Record<string, PlaylistPreviewPlayback>;
}) {
  const channel = useRef<BroadcastChannel | null>(null);

  const zonePreviews = useMemo<Record<string, ZonePreview>>(() => {
    const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
    const next: Record<string, ZonePreview> = {};
    for (const binding of bindings) {
      const assetId = binding.source === "assets"
        ? binding.assetItems[0]?.media_asset_id
        : binding.playlistId ? playlistPreviewAssetIds[binding.playlistId] : undefined;
      const url = assetId ? previews[assetId] : undefined;
      if (!assetId || !url) continue;
      const asset = assetsById[assetId];
      next[binding.layoutZoneId] = {
        url,
        thumbnailUrl: previewThumbnails[assetId],
        kind: asset?.kind,
        mimeType: asset?.file?.mime_type,
      };
    }
    return next;
  }, [assets, bindings, playlistPreviewAssetIds, previews, previewThumbnails]);

  const playlistPreviews = useMemo(
    () => Object.fromEntries(playlists.flatMap((playlist) => {
      const assetId = playlistPreviewAssetIds[playlist.id];
      const url = assetId ? previews[assetId] : undefined;
      return url ? [[playlist.id, { url, thumbnailUrl: previewThumbnails[assetId] }]] : [];
    })),
    [playlistPreviewAssetIds, playlists, previews, previewThumbnails],
  );

  const playbackPreviewZones = useMemo<PlaybackPreviewZone[]>(() => {
    if (!layout) return [];
    const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
    return layout.zones.map((zone) => {
      const binding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
      const bound = binding?.source === "assets"
        ? binding.assetItems
        : binding?.playlistId ? playlistItemsById[binding.playlistId] ?? [] : [];
      /** An item with no override plays for as long as its asset lasts, and is named after it.
       *  The shared converter only sees the item, so resolve both against the assets here. */
      const items = bound.map((item) => {
        const asset = assetsById[item.media_asset_id];
        return {
          ...item,
          title: ("title" in item ? item.title : undefined) ?? asset?.title ?? asset?.file?.original_filename,
          duration_seconds: item.duration_seconds ?? asset?.duration_seconds ?? null,
        };
      });
      return compositionZonePreview(
        { id: zone.id ?? `zone-${zone.position}`, name: zone.name, x: zone.x, y: zone.y, width: zone.width, height: zone.height, playback: binding?.playback },
        items,
        binding?.playlistId ? playlistPlaybackById[binding.playlistId] : undefined,
      );
    });
  }, [assets, bindings, layout, playlistItemsById, playlistPlaybackById]);

  const handoff = useMemo<CompositionPreviewHandoff | null>(() => {
    if (!compositionId || !layout) return null;
    const assetIds = new Set(playbackPreviewZones.flatMap((zone) => zone.items.map((item) => item.mediaAssetId)));
    return {
      source: "composition",
      id: compositionId,
      zones: playbackPreviewZones,
      assets: assets.filter((asset) => assetIds.has(asset.id)),
      aspectRatio: layout.aspect_ratio,
      referenceResolution: layout.reference_resolution ?? null,
    };
  }, [assets, compositionId, layout, playbackPreviewZones]);

  const handoffRef = useRef(handoff);
  useEffect(() => {
    handoffRef.current = handoff;
  }, [handoff]);

  useEffect(() => {
    const closeSession = () => {
      channel.current?.postMessage({ type: "close" });
      channel.current?.close();
    };
    window.addEventListener("beforeunload", closeSession);
    return () => {
      window.removeEventListener("beforeunload", closeSession);
      closeSession();
    };
  }, []);

  /** A saved-and-clean Composition can just be opened by id. A dirty one has to hand the
   *  draft over live, so the tab gets a random rendezvous channel instead of the draft in
   *  the URL. */
  const openFullPreview = (isDirty: boolean) => {
    if (!compositionId) return;
    const path = `/media-workspace/preview/composition/${encodeURIComponent(compositionId)}`;
    if (!isDirty || !handoff) {
      window.open(path, "_blank", "noopener");
      return;
    }
    channel.current?.close();
    const channelName = `thunder-one-preview:${crypto.randomUUID()}`;
    const opened = new BroadcastChannel(channelName);
    opened.onmessage = ({ data }: MessageEvent<{ type?: string }>) => {
      if (data?.type !== "connect" && data?.type !== "heartbeat") return;
      const current = handoffRef.current;
      if (!current) return;
      opened.postMessage({ type: "handoff", handoff: current });
      opened.postMessage({ type: "heartbeat-reply" });
    };
    channel.current = opened;
    window.open(`${path}?previewSession=${encodeURIComponent(channelName)}`, "_blank", "noopener");
  };

  return { zonePreviews, playlistPreviews, playbackPreviewZones, openFullPreview };
}
