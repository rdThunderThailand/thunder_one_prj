"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import { playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import type { ZonePreviewFrame } from "@/features/media-workspace/preview/preview-clock";
import type { MediaAsset } from "@/types/domain";
import { formatDuration } from "../duration";
import { itemStartSeconds, totalItemsDurationSeconds } from "../playlist-editor-state";
import type { DraftItem, PlaylistPlayback } from "../types";

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
        items: items.map((i) => ({
          mediaAssetId: i.mediaAssetId,
          title: i.title,
          durationSeconds: i.durationSeconds,
          transition: i.transition,
        })),
        playback,
      }),
    [name, items, playback],
  );
  const previews = usePreviewUrls(useMemo(() => items.map((i) => i.mediaAssetId), [items]));
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const total = formatDuration(totalItemsDurationSeconds(items, assets));
  const startSeconds = useMemo(() => itemStartSeconds(items, assets), [assets, items]);

  return (
    <Card className="flex flex-none flex-col p-5">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h2>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Duration {total}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-400 dark:border-zinc-800">
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
            frameViewportHeight="75vh"
          />

          <div className="mt-[11px] grid h-[157px] shrink-0 grid-flow-col auto-cols-[150px] gap-3 overflow-x-auto overflow-y-hidden pb-1">
            {items.map((item, index) => {
              const asset = assetById[item.mediaAssetId];
              const seconds = item.durationSeconds ?? asset?.duration_seconds ?? null;
              const isSelected = selectedId === item.mediaAssetId;
              return (
                <button
                  key={item.mediaAssetId}
                  type="button"
                  onClick={() => {
                    onSelect(item.mediaAssetId);
                    onSeek(startSeconds[index] ?? 0);
                  }}
                  className="h-[150px] w-[150px] text-left"
                >
                  <span
                    className={`block overflow-hidden rounded-lg border-2 ${
                      isSelected
                        ? "border-indigo-500"
                        : nowPlayingId === item.mediaAssetId
                          ? "border-emerald-500"
                          : "border-transparent"
                    }`}
                  >
                    <MediaThumb
                      url={previews.urls[item.mediaAssetId]}
                      kind={item.kind ?? asset?.kind}
                      alt={item.title ?? asset?.title ?? ""}
                      className="h-[118px] w-full rounded-none"
                    />
                  </span>
                  <span className="mt-1 block truncate text-center text-base font-bold text-zinc-700 dark:text-zinc-200">
                    {index + 1} · {seconds != null ? formatDuration(seconds) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}
