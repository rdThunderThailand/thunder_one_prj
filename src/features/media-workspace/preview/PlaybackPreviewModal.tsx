"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EditIcon, ExpandIcon } from "@/components/ui/icons";
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
  layoutName = "Layout preview",
  canOpenFullPreview = false,
  onOpenFullPreview,
  editHref,
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
  layoutName?: string;
  canOpenFullPreview?: boolean;
  onOpenFullPreview?: () => void;
  editHref?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preview Layout"
      size="preview"
      showCloseButton
      footer={onOpenFullPreview ? <>
        {editHref && <Link href={editHref} className={buttonClasses("secondary")}><EditIcon /> Edit Layout</Link>}
        <Button
          variant="secondary"
          onClick={onOpenFullPreview}
          disabled={!canOpenFullPreview}
          title={canOpenFullPreview ? "Open preview in a new tab" : "Save this Layout before opening a full preview"}
        >
          <ExpandIcon /> Open full preview
        </Button>
      </> : <Button variant="secondary" onClick={onClose}>Close preview</Button>}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-900">{layoutName.trim() || "Untitled Layout"}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live simulation
          </p>
        </div>
        <p className="text-xs font-medium text-zinc-500">
          {referenceResolution ?? "Custom"} <span className="px-1.5 text-zinc-300">•</span> {aspectRatio}
          <span className="px-1.5 text-zinc-300">•</span> {zones.length} {zones.length === 1 ? "Zone" : "Zones"}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl bg-white">
        <PreviewStage
          zones={zones}
          assets={assets}
          aspectRatio={aspectRatio}
          conflictCount={conflictCount}
          previewUrls={previewUrls}
          geometryOptions={geometryOptions}
          referenceResolution={referenceResolution}
          active={open}
          controlsPlacement="overlay"
          frameViewportHeight="65vh"
        />
      </div>
    </Modal>
  );
}
