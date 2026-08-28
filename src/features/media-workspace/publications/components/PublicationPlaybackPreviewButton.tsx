"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlaybackPreviewModal, type PlaybackPreviewZone } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { loadCompositionPreview } from "@/features/media-workspace/preview/composition-preview";
import { groupDeviceGeometries } from "@/features/media-workspace/preview/preview-geometry";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import type { MediaAsset } from "@/types/domain";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

export function PublicationPlaybackPreviewButton({
  assets,
  className = "",
  conflictCount = 0,
  deviceResolutions = [],
}: {
  assets: MediaAsset[];
  className?: string;
  conflictCount?: number;
  /** Every selected target's reported `WxH`, duplicates included — the stage groups and counts
   *  them. `null` entries are Devices reporting no geometry. */
  deviceResolutions?: (string | null)[];
}) {
  const basicInfo = usePublicationDraftStore((state) => state.basicInfo);
  const assetItems = usePublicationDraftStore((state) => state.assetItems);
  const playlistId = usePublicationDraftStore((state) => state.playlistId);
  const compositionId = usePublicationDraftStore((state) => state.compositionId);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zones, setZones] = useState<PlaybackPreviewZone[]>([]);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [referenceResolution, setReferenceResolution] = useState<string | null>(null);
  const geometryOptions = useMemo(() => groupDeviceGeometries(deviceResolutions), [deviceResolutions]);

  const hasContent = basicInfo.publicationType === "composition"
    ? !!compositionId
    : basicInfo.publicationType === "playlist"
    ? !!playlistId
    : assetItems.length > 0;

  const openPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      if (basicInfo.publicationType === "composition" && compositionId) {
        const preview = await loadCompositionPreview(compositionId);
        setZones(preview.zones);
        setAspectRatio(preview.aspectRatio);
        setReferenceResolution(preview.referenceResolution);
      } else if (basicInfo.publicationType === "playlist" && playlistId) {
        const playlist = await fetchPlaylist(playlistId);
        const playback = decodeMetadata(playlist.metadata).playback;
        setZones([{
          id: playlist.id,
          name: playlist.name,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          playback: {
            playMode: playback.playMode,
            repeat: playback.repeat,
            startFrom: playback.startFrom,
          },
          items: playlist.items.map((item) => ({
            mediaAssetId: item.media_asset_id,
            label: item.title,
            durationSeconds: item.duration_seconds,
            transition: item.transition,
          })),
        }]);
        setAspectRatio("16:9");
        setReferenceResolution(null);
      } else {
        setZones([{
          id: "publication-assets",
          name: basicInfo.name || "Publication",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          items: assetItems.map((item) => ({
            mediaAssetId: item.media_asset_id,
            durationSeconds: item.duration_seconds,
            transition: item.transition,
          })),
        }]);
        setAspectRatio("16:9");
        setReferenceResolution(null);
      }
      setOpen(true);
    } catch {
      setError("โหลด Content สำหรับ preview ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" className={`px-3 py-1.5 text-xs ${className}`} onClick={openPreview} disabled={!hasContent || loading}>
        {loading ? "Loading preview…" : "Preview playback"}
      </Button>
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      <PlaybackPreviewModal open={open} onClose={() => setOpen(false)} zones={zones} assets={assets} aspectRatio={aspectRatio} conflictCount={conflictCount} geometryOptions={geometryOptions} referenceResolution={referenceResolution} />
    </>
  );
}
