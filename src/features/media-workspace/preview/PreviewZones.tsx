"use client";

import { MuteIcon } from "@/components/ui/icons";
import type { MediaAsset } from "@/types/domain";
import { PreviewSurface } from "./PreviewSurface";
import { previewFrameAt, type PlaybackPreviewZone, type ZoneSchedule } from "./preview-clock";

export function PreviewZones({
  zones, schedules, assetsById, urls, thumbnailUrls, timeSeconds, playing, speed, muted, loadState, background,
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
  background?: string;
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
        className="absolute overflow-hidden bg-foreground"
        style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%`, backgroundColor: background }}
        title={`${nameLabel} · ${timeLabel}`}
      >
        <div className="relative h-full w-full">
          {/* ADR 0094: both surfaces stay mounted during a fade; the outgoing one holds its last frame
              while the incoming one plays from its own start. */}
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
            playing={playing}
            speed={speed}
            muted={muted}
            offsetSeconds={frame.offsetSeconds}
            loadState={loadState}
            defaultMediaFit={zone.playback?.mediaFit}
            zoneMediaFit={zone.playback?.zoneMediaFitOverride}
            style={transition ? { position: "absolute", inset: 0, opacity: transition.progress } : undefined}
          />
        </div>
        {/* Borderless and label-free like the screen itself; only mute keeps a marker (ADR 0064 §7),
            and it never changes the preview's audio policy. */}
        {zone.playback?.zoneMuted && (
          <span
            role="img"
            aria-label="This Zone is set to mute"
            className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-foreground/60 p-1 text-primary-foreground"
          >
            <MuteIcon className="h-3 w-3" />
          </span>
        )}
      </div>
    );
  });
}
