"use client";

// Lovable `playlist-preview.tsx`: the Playlist preview as a sheet over the editor. The
// BroadcastChannel tab (ADR 0061 §4) stays reachable from "Open full preview".

import { Button } from "@/components/ui/lovable/button";
import { ExpandIcon } from "@/components/ui/icons";
import { formatDuration } from "@/features/media-workspace/playlists/duration";
import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "./composition-preview";
import { PlaylistPreviewContent } from "./PlaylistPreviewContent";
import { PreviewModalChrome, previewOutlineButton } from "./PreviewModalChrome";
import { zoneSchedule } from "./preview-clock";

export function PlaylistPreviewModal({ open, onClose, preview, assets, onOpenFullPreview, onPublish, publishDisabledReason }: {
  open: boolean;
  onClose: () => void;
  preview: StagePreview;
  assets: MediaAsset[];
  onOpenFullPreview: () => void;
  onPublish: () => void;
  publishDisabledReason: string | null;
}) {
  const zone = preview.zones[0];
  const durationById = Object.fromEntries(assets.map((asset) => [asset.id, asset.duration_seconds]));
  const totalSeconds = zoneSchedule(
    zone.items.map((item) => ({ ...item, durationSeconds: item.durationSeconds ?? durationById[item.mediaAssetId] })),
    zone.playback,
    zone.id,
  ).totalSeconds;

  return (
    <PreviewModalChrome
      open={open}
      onClose={onClose}
      title="Preview Playlist"
      description="Full-screen playlist preview"
      badge={<span className="truncate text-[11px] text-primary-foreground/70">{zone.name}</span>}
      subtitle={`${zone.items.length} ${zone.items.length === 1 ? "item" : "items"} · Total duration ${formatDuration(totalSeconds)}`}
      actions={
        <>
          <Button size="sm" variant="outline" className={previewOutlineButton} onClick={onOpenFullPreview}>
            <ExpandIcon /> Open full preview
          </Button>
          <Button size="sm" onClick={() => { onClose(); onPublish(); }} disabled={!!publishDisabledReason} title={publishDisabledReason ?? undefined}>
            Publish
          </Button>
        </>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <PlaylistPreviewContent preview={preview} assets={assets} active={open} />
      </div>
    </PreviewModalChrome>
  );
}
