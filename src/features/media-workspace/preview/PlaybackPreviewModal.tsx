"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { MediaAsset } from "@/types/domain";
import { PreviewStage } from "./PreviewStage";
import type { PlaybackPreviewZone } from "./preview-clock";
import type { GeometryOption } from "./preview-geometry";

export type { PlaybackPreviewItem, PlaybackPreviewSettings, PlaybackPreviewZone } from "./preview-clock";

export function PlaybackPreviewModal({
  open,
  onClose,
  zones,
  assets,
  aspectRatio = "16:9",
  conflictCount = 0,
  previewUrls,
  geometryOptions,
  referenceResolution,
}: {
  open: boolean;
  onClose: () => void;
  zones: PlaybackPreviewZone[];
  assets: MediaAsset[];
  aspectRatio?: string;
  conflictCount?: number;
  previewUrls?: Record<string, string | undefined>;
  geometryOptions?: GeometryOption[];
  referenceResolution?: string | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Layout preview"
      className="max-w-6xl"
      footer={<Button variant="secondary" onClick={onClose}>Close preview</Button>}
    >
      <PreviewStage
        zones={zones}
        assets={assets}
        aspectRatio={aspectRatio}
        conflictCount={conflictCount}
        previewUrls={previewUrls}
        geometryOptions={geometryOptions}
        referenceResolution={referenceResolution}
        active={open}
      />
    </Modal>
  );
}
