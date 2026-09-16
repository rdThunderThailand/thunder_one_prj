"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlaybackPreviewModal } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { groupDeviceGeometries } from "@/features/media-workspace/preview/preview-geometry";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";
import type { MediaAsset } from "@/types/domain";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";

export function PublicationPlaybackPreviewButton({
  assets,
  className = "",
  conflictCount = 0,
  deviceResolutions = [],
  preview: previewProp,
}: {
  assets: MediaAsset[];
  className?: string;
  conflictCount?: number;
  /** Every selected target's reported `WxH`, duplicates included — the stage groups and counts
   *  them. `null` entries are Devices reporting no geometry. */
  deviceResolutions?: (string | null)[];
  /** Passed by the Prepare Content frame, which already holds the projected stage — avoids a
   *  second fetch of the same Playlist/Composition. Omitted elsewhere, so the hook loads it. */
  preview?: StagePreview | null;
}) {
  const [open, setOpen] = useState(false);
  const hook = usePublicationStagePreview(assets, previewProp === undefined);
  const preview = previewProp ?? hook.preview;
  const loading = previewProp === undefined && hook.loading;
  const hasContent = previewProp !== undefined ? Boolean(previewProp) : hook.hasContent;
  const geometryOptions = useMemo(() => groupDeviceGeometries(deviceResolutions), [deviceResolutions]);

  return (
    <>
      <Button
        variant="secondary"
        className={`px-3 py-1.5 text-xs ${className}`}
        onClick={() => setOpen(true)}
        disabled={!hasContent || loading || !preview}
      >
        {loading ? "Loading preview…" : "Preview playback"}
      </Button>
      {hook.error && <p className="text-xs text-red-600" role="alert">โหลด Content สำหรับ preview ไม่สำเร็จ</p>}
      {preview && (
        <PlaybackPreviewModal
          open={open}
          onClose={() => setOpen(false)}
          zones={preview.zones}
          assets={assets}
          aspectRatio={preview.aspectRatio}
          conflictCount={conflictCount}
          geometryOptions={geometryOptions}
          referenceResolution={preview.referenceResolution}
        />
      )}
    </>
  );
}
