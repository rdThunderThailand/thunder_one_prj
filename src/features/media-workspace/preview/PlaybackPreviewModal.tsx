"use client";

// Lovable `layout-preview.tsx`: header (title · live dot · meta · actions), the frame centred
// in the sheet, and a flat control bar as the footer.

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import { EditIcon, ExpandIcon } from "@/components/ui/icons";
import type { MediaAsset } from "@/types/domain";
import { PreviewModalChrome, previewOutlineButton } from "./PreviewModalChrome";
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
    <PreviewModalChrome
      open={open}
      onClose={onClose}
      title="Preview Layout"
      description="Live layout playback simulation"
      badge={
        <span className="flex items-center gap-1 text-[10px] text-success">
          <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" /> Live Simulation
        </span>
      }
      subtitle={`${layoutName.trim() || "Untitled Layout"} · ${referenceResolution ?? "Custom"} (${aspectRatio}) · ${zones.length} ${zones.length === 1 ? "Zone" : "Zones"}`}
      actions={
        <>
          {editHref && (
            <Link href={editHref} className={`${buttonVariants({ variant: "outline", size: "sm" })} ${previewOutlineButton}`}>
              <EditIcon /> Edit Layout
            </Link>
          )}
          {onOpenFullPreview && (
            <Button
              size="sm"
              variant="outline"
              className={previewOutlineButton}
              onClick={onOpenFullPreview}
              disabled={!canOpenFullPreview}
              title={canOpenFullPreview ? "Open preview in a new tab" : "Save this Layout before opening a full preview"}
            >
              <ExpandIcon /> Open full preview
            </Button>
          )}
        </>
      }
    >
      <main className="flex min-h-0 flex-1 flex-col">
        <PreviewStage
          zones={zones}
          assets={assets}
          aspectRatio={aspectRatio}
          conflictCount={conflictCount}
          previewUrls={previewUrls}
          geometryOptions={geometryOptions}
          referenceResolution={referenceResolution}
          active={open}
          controlsPlacement="footer"
          frameViewportHeight="calc(96vh - 190px)"
        />
      </main>
    </PreviewModalChrome>
  );
}
