"use client";

import type { MediaAsset } from "@/types/domain";
import { PreviewSurface } from "./PreviewSurface";
import { previewFrameAt, type PlaybackPreviewZone, type ZoneSchedule } from "./preview-clock";

export function PreviewZones({
  zones, schedules, assetsById, urls, thumbnailUrls, timeSeconds, playing, speed, muted, loadState,
}: {
  zones: PlaybackPreviewZone[];
  schedules: ZoneSchedule[];
  assetsById: Record<string, MediaAsset>;
  urls: Record<string, string | undefined>;
  thumbnailUrls: Record<string, string | undefined>;
  timeSeconds: number;
  playing: boolean;
  speed: number;
  muted: boolean;
  loadState: "idle" | "loading" | "ready" | "error";
}) {
  return zones.map((zone, zoneIndex) => {
    const frame = previewFrameAt(schedules[zoneIndex], zone.items, timeSeconds);
    const zoneTimeSeconds = frame.ended
      ? frame.loopDurationSeconds
      : frame.loopDurationSeconds > 0 ? timeSeconds % frame.loopDurationSeconds : 0;
    const timeLabel = frame.ended ? "Ended" : frame.loopDurationSeconds
      ? `${Math.floor(zoneTimeSeconds)}s / ${Math.floor(frame.loopDurationSeconds)}s` : "Needs duration";
    const nameLabel = `${zone.name}${zone.playback?.zoneMuted ? " · This Zone is set to mute" : ""}`;
    const transition = frame.transition;
    return (
      <div
        key={zone.id}
        className="absolute overflow-hidden border border-primary-foreground/25 bg-foreground"
        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
        title={`${nameLabel} · ${timeLabel}`}
      >
        <div className="relative h-full w-full">
          {/* ADR 0062 §5: preserve both surfaces during fades and freeze the outgoing frame. */}
          {transition && (
            <PreviewSurface
              key={`out-${transition.outgoingIndex}`}
              item={transition.outgoingItem}
              asset={assetsById[transition.outgoingItem.mediaAssetId]}
              url={urls[transition.outgoingItem.mediaAssetId]}
              posterUrl={thumbnailUrls[transition.outgoingItem.mediaAssetId]}
              playing={false}
              speed={speed}
              muted={muted}
              offsetSeconds={transition.outgoingOffsetSeconds}
              loadState={loadState}
              defaultMediaFit={zone.playback?.mediaFit}
              zoneMediaFit={zone.playback?.zoneMediaFitOverride}
              style={{ position: "absolute", inset: 0, opacity: 1 - transition.progress }}
            />
          )}
          <PreviewSurface
            key={frame.itemIndex ?? "empty"}
            item={frame.item}
            asset={frame.item ? assetsById[frame.item.mediaAssetId] : undefined}
            url={frame.item ? urls[frame.item.mediaAssetId] : undefined}
            posterUrl={frame.item ? thumbnailUrls[frame.item.mediaAssetId] : undefined}
            playing={transition ? false : playing}
            speed={speed}
            muted={muted}
            offsetSeconds={frame.offsetSeconds}
            loadState={loadState}
            defaultMediaFit={zone.playback?.mediaFit}
            zoneMediaFit={zone.playback?.zoneMediaFitOverride}
            style={transition ? { position: "absolute", inset: 0, opacity: transition.progress } : undefined}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex min-w-0 items-center gap-2 bg-gradient-to-b from-foreground/70 to-transparent px-2 py-1 text-[10px] font-medium text-primary-foreground">
          <span className="min-w-0 flex-1 truncate" aria-label={nameLabel}>
            {zone.name}
            {/* ADR 0064 §7: this label never changes the preview's audio policy. */}
            {zone.playback?.zoneMuted && <span aria-hidden="true"> 🔇</span>}
          </span>
          <span className="min-w-0 max-w-[50%] truncate" aria-label={timeLabel}>
            {timeLabel}
          </span>
        </div>
      </div>
    );
  });
}
