"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/lovable/dialog";
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
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-[min(96vw,1200px)] gap-0 overflow-hidden border-background/15 bg-program p-0 text-background">
        <DialogHeader className="border-b border-background/15 px-6 py-4 pr-12">
          <DialogTitle>Preview Layout</DialogTitle>
          <DialogDescription className="sr-only">Live layout playback simulation</DialogDescription>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-background">{layoutName.trim() || "Untitled Layout"}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-background/70">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live simulation
              </p>
            </div>
            <p className="text-xs font-medium text-background/70">
              {referenceResolution ?? "Custom"} <span className="px-1.5">•</span> {aspectRatio}
              <span className="px-1.5">•</span> {zones.length} {zones.length === 1 ? "Zone" : "Zones"}
            </p>
          </div>
        </DialogHeader>
        <div className="max-h-[72vh] overflow-y-auto p-6">
          <div className="overflow-hidden rounded-xl bg-card/5">
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
        </div>
        <DialogFooter className="border-t border-background/15 px-6 py-4">
          {onOpenFullPreview ? (
            <>
              {editHref && (
                <Link href={editHref} className={buttonVariants({ variant: "outline" })}>
                  <EditIcon /> Edit Layout
                </Link>
              )}
              <Button
                variant="outline"
                onClick={onOpenFullPreview}
                disabled={!canOpenFullPreview}
                title={canOpenFullPreview ? "Open preview in a new tab" : "Save this Layout before opening a full preview"}
              >
                <ExpandIcon /> Open full preview
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>Close preview</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
