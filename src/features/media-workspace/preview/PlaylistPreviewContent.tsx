"use client";

// The Playlist preview body — stage, timeline strip, note and the information panel — shared
// by the in-editor modal (Lovable `playlist-preview.tsx`) and the full-preview tab.

import { useMemo, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { formatDuration } from "@/features/media-workspace/playlists/duration";
import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "./composition-preview";
import { PlaylistPreviewPanel } from "./PlaylistPreviewPanel";
import { PreviewStage } from "./PreviewStage";
import { zoneSchedule, type PlaybackPreviewItem, type ZonePreviewFrame, type ZoneSchedule } from "./preview-clock";

export function PlaylistPreviewContent({ preview, assets, active = true }: {
  preview: StagePreview;
  assets: MediaAsset[];
  active?: boolean;
}) {
  const zone = preview.zones[0];
  const items = useMemo(() => {
    const durationById = Object.fromEntries(assets.map((asset) => [asset.id, asset.duration_seconds]));
    return zone.items.map((item) => ({ ...item, durationSeconds: item.durationSeconds ?? durationById[item.mediaAssetId] }));
  }, [assets, zone.items]);
  const [frame, setFrame] = useState<ZonePreviewFrame | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);
  // ADR 0062 §1: one schedule per Zone, memoised here and read by everything below it.
  const schedule = useMemo(() => zoneSchedule(items, zone.playback, zone.id), [items, zone.playback, zone.id]);
  // ADR 0061 §2: a Playlist has no geometry of its own, so the operator picks the frame.
  const [previewMode, setPreviewMode] = useState("16:9");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <PreviewStage
          zones={preview.zones}
          assets={assets}
          aspectRatio={previewMode}
          referenceResolution={null}
          geometryOptions={[]}
          allowActualSize={false}
          active={active}
          controlsPlacement="overlay"
          seekRequest={seekRequest}
          onFrameChange={setFrame}
        />
        <PlaylistTimelineStrip
          items={items}
          assets={assets}
          schedule={schedule}
          frame={frame}
          onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
        />
        <p className="mt-2 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-2 text-[11px] text-primary-foreground/80">
          This is a preview only. Actual playback may vary slightly depending on your screen and network.
        </p>
      </section>

      <PlaylistPreviewPanel
        name={zone.name}
        items={items}
        playback={zone.playback}
        totalSeconds={schedule.totalSeconds}
        frame={frame}
        assets={assets}
        tone="dark"
        previewMode={previewMode}
        onPreviewMode={setPreviewMode}
      />
    </div>
  );
}

function PlaylistTimelineStrip({ items, assets, schedule, frame, onSeek }: {
  items: PlaybackPreviewItem[];
  assets: MediaAsset[];
  schedule: ZoneSchedule;
  frame: ZonePreviewFrame | null;
  onSeek: (seconds: number) => void;
}) {
  const previews = usePreviewUrls(useMemo(() => items.map((item) => item.mediaAssetId), [items]));
  const assetById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets]);
  return (
    <section className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-foreground/70">
        Playlist Timeline <span className="font-medium normal-case tracking-normal">(Total {formatDuration(schedule.totalSeconds)})</span>
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
        {items.map((item, index) => {
          const asset = assetById[item.mediaAssetId];
          const seconds = item.durationSeconds ?? asset?.duration_seconds ?? null;
          const active = frame?.item?.mediaAssetId === item.mediaAssetId;
          return (
            <button
              key={item.mediaAssetId}
              type="button"
              onClick={() => onSeek(schedule.starts[schedule.order.indexOf(index)] ?? 0)}
              className="w-36 shrink-0 text-left"
            >
              <span className={`relative block aspect-video overflow-hidden rounded-lg border-2 bg-black ${active ? "border-primary" : "border-transparent hover:border-primary-foreground/30"}`}>
                <MediaThumb url={previews.urls[item.mediaAssetId]} kind={asset?.kind} alt={item.label ?? ""} className="h-full w-full rounded-none" />
                <span className="absolute left-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded bg-overlay px-1 text-[10px] font-bold text-primary-foreground">{index + 1}</span>
              </span>
              <span className="mt-1.5 block truncate text-[11px] font-semibold text-primary-foreground">{item.label ?? "Untitled item"}</span>
              <span className="text-[10px] text-primary-foreground/60">{asset?.kind === "video" ? "Video" : "Image"} · {seconds != null ? formatDuration(seconds) : "—"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
