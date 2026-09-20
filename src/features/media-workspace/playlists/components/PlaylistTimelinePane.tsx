"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import { draftItemToPreview, playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import type { ZonePreviewFrame } from "@/features/media-workspace/preview/preview-clock";
import type { MediaAsset } from "@/types/domain";
import { formatDuration } from "../duration";
import { itemStartSeconds, totalItemsDurationSeconds } from "../playlist-editor-state";
import type { DraftItem, PlaylistPlayback } from "../types";

const shortDuration = (seconds: number) => seconds < 60
  ? `${Math.floor(seconds)}s`
  : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** #36 center pane: the shared PreviewStage embedded live (ADR 0061 — one full-frame Zone),
 *  plus a filmstrip that stays in step with the item list. Its own control box is the scrubber;
 *  ponytail: two independent clocks (this and the popped-out Preview tab) — different windows,
 *  no sync expected. */
export function PlaylistTimelinePane({
  name,
  items,
  playback,
  assets,
  selectedId,
  nowPlayingId,
  onSelect,
  onFrame,
  seekRequest,
  onSeek,
}: {
  name: string;
  items: DraftItem[];
  playback: PlaylistPlayback;
  assets: MediaAsset[];
  selectedId: string | null;
  nowPlayingId: string | null;
  onSelect: (mediaAssetId: string) => void;
  onFrame: (frame: ZonePreviewFrame | null) => void;
  seekRequest: { seconds: number; id: number } | null;
  onSeek: (seconds: number) => void;
}) {
  const stage = useMemo(
    () =>
      playlistPreviewStage({
        name,
        items: items.map(draftItemToPreview),
        playback,
      }),
    [name, items, playback],
  );
  const previews = usePreviewUrls(useMemo(() => items.map((i) => i.mediaAssetId), [items]));
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const totalSeconds = totalItemsDurationSeconds(items, assets, playback);
  const total = formatDuration(totalSeconds);
  const startSeconds = useMemo(() => itemStartSeconds(items, assets, playback), [assets, items, playback]);

  return (
    <Card className="flex flex-none flex-col p-3">
      <div className="mb-3 flex shrink-0 items-end justify-between border-b border-border">
        <span className="border-b-2 border-primary px-3 pb-2 text-[11px] font-semibold text-primary">Timeline</span>
        <span className="text-[10px] text-muted-foreground">Total Duration {total}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          เพิ่ม media เพื่อดู timeline
        </p>
      ) : (
        <>
          <PreviewStage
            zones={stage.zones}
            assets={assets}
            aspectRatio={stage.aspectRatio}
            referenceResolution={stage.referenceResolution}
            geometryOptions={[]}
            allowActualSize={false}
            onFrameChange={onFrame}
            seekRequest={seekRequest}
            controlsPlacement="overlay"
            frameViewportHeight="34vh"
          />

          <div className="mt-3 flex justify-between text-[10px] font-medium text-muted-foreground">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index}>{formatDuration((totalSeconds * index) / 4)}</span>
            ))}
          </div>
          <div className="mt-1 flex shrink-0 gap-2 overflow-x-auto pb-1">
            {items.map((item, index) => {
              const asset = assetById[item.mediaAssetId];
              const seconds = item.durationSeconds ?? asset?.duration_seconds ?? null;
              const isSelected = selectedId === item.mediaAssetId;
              return (
                <div key={item.mediaAssetId} className="w-[88px] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.mediaAssetId);
                      onSeek(startSeconds[index] ?? 0);
                    }}
                    className="w-full text-left"
                  >
                    <span
                      className={`block overflow-hidden rounded-lg border-2 ${
                        isSelected
                          ? "border-primary"
                          : nowPlayingId === item.mediaAssetId
                            ? "border-success"
                            : "border-transparent"
                      }`}
                    >
                      <MediaThumb
                        url={previews.urls[item.mediaAssetId]}
                        kind={item.kind ?? asset?.kind}
                        alt={item.title ?? asset?.title ?? ""}
                        className="aspect-video w-full rounded-none"
                      />
                    </span>
                    <span className="mt-1 block truncate text-center text-[9px] text-muted-foreground">
                      {seconds != null ? shortDuration(seconds) : "—"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
