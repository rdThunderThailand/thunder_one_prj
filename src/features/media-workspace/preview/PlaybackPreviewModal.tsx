"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseAspectRatio } from "@/features/media-workspace/layouts/geometry";
import { fetchPreviewUrls } from "@/lib/api/media-api";
import { isVideoUrl } from "@/lib/media-kind";
import type { MediaAsset } from "@/types/domain";
import { previewFrameAt, zoneLoopDurationSeconds, type PlaybackPreviewItem, type PlaybackPreviewSettings, type PlaybackPreviewZone } from "./preview-clock";

export type { PlaybackPreviewItem, PlaybackPreviewSettings, PlaybackPreviewZone } from "./preview-clock";

const EMPTY_PREVIEW_URLS: Record<string, string | undefined> = {};

export function PlaybackPreviewModal({
  open,
  onClose,
  zones,
  assets,
  aspectRatio = "16:9",
  conflictCount = 0,
  previewUrls = EMPTY_PREVIEW_URLS,
}: {
  open: boolean;
  onClose: () => void;
  zones: PlaybackPreviewZone[];
  assets: MediaAsset[];
  aspectRatio?: string;
  conflictCount?: number;
  previewUrls?: Record<string, string | undefined>;
}) {
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [urls, setUrls] = useState<Record<string, string | undefined>>({});
  const [previewLoadState, setPreviewLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const startedAt = useRef<number | null>(null);
  const initialTime = useRef(0);

  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets]);
  const resolvedZones = useMemo(
    () => zones.map((zone) => ({
      ...zone,
      items: zone.items.map((item) => ({ ...item, durationSeconds: item.durationSeconds ?? assetsById[item.mediaAssetId]?.duration_seconds })),
    })),
    [assetsById, zones],
  );
  const assetIds = useMemo(
    () => [...new Set(resolvedZones.flatMap((zone) => zone.items.map((item) => item.mediaAssetId)))],
    [resolvedZones],
  );
  const timelineSeconds = Math.max(1, ...resolvedZones.map((zone) => zoneLoopDurationSeconds(zone.items)));
  const [ratioWidth, ratioHeight] = parseAspectRatio(aspectRatio) ?? [16, 9];

  useEffect(() => {
    if (!open) return;
    setTimeSeconds(0);
    setPlaying(false);
    setSpeed(1);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const missingAssetIds = assetIds.filter((id) => !previewUrls[id]);
    setUrls(previewUrls);
    if (missingAssetIds.length === 0) {
      setPreviewLoadState("ready");
      return;
    }
    let alive = true;
    setPreviewLoadState("loading");
    fetchPreviewUrls(missingAssetIds)
      .then((result) => {
        if (!alive) return;
        setUrls((current) => ({ ...current, ...result.urls }));
        setPreviewLoadState("ready");
      })
      .catch(() => alive && setPreviewLoadState("error"));
    return () => {
      alive = false;
    };
  }, [assetIds, open, previewUrls]);

  useEffect(() => {
    if (!playing) return;
    initialTime.current = timeSeconds;
    startedAt.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setTimeSeconds(Math.min(timelineSeconds, initialTime.current + ((now - (startedAt.current ?? now)) / 1000) * speed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, timelineSeconds]);

  useEffect(() => {
    if (timeSeconds >= timelineSeconds && playing) setPlaying(false);
  }, [playing, timeSeconds, timelineSeconds]);

  const setTimelineTime = (next: number) => {
    setTimeSeconds(next);
    initialTime.current = next;
    startedAt.current = performance.now();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Layout preview"
      className="max-w-6xl"
      footer={<Button variant="secondary" onClick={onClose}>Close preview</Button>}
    >
      <div className="space-y-4">
        <div
          className="overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner"
          style={{ aspectRatio: `${ratioWidth} / ${ratioHeight}` }}
        >
          <div className="relative h-full w-full">
            {resolvedZones.map((zone) => {
              const frame = previewFrameAt(zone.items, timeSeconds);
              const zoneTimeSeconds = frame.loopDurationSeconds > 0 ? timeSeconds % frame.loopDurationSeconds : 0;
              return (
                <div
                  key={zone.id}
                  className="absolute overflow-hidden border border-white/25 bg-zinc-950"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                >
                  <PreviewSurface
                    item={frame.item}
                    asset={frame.item ? assetsById[frame.item.mediaAssetId] : undefined}
                    url={frame.item ? urls[frame.item.mediaAssetId] : undefined}
                    playing={playing}
                    speed={speed}
                    offsetSeconds={frame.offsetSeconds}
                    loadState={previewLoadState}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-2 py-1 text-[10px] font-medium text-white">
                    <span>{zone.name}</span>
                    <span>{frame.loopDurationSeconds ? `${Math.floor(zoneTimeSeconds)}s / ${Math.floor(frame.loopDurationSeconds)}s` : "Needs duration"}</span>
                  </div>
                </div>
              );
            })}
            {resolvedZones.length === 0 && <div className="flex h-full items-center justify-center text-sm text-zinc-400">No Zones to preview</div>}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
          {conflictCount > 0 && (
            <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800" role="status">
              Preview shows this draft alone. {conflictCount} other publication{conflictCount === 1 ? "" : "s"} may merge on the same screen.
            </p>
          )}
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>Shared timeline · all Zones start at 0s</span>
            <span>{timeSeconds.toFixed(1)}s / {timelineSeconds}s · muted</span>
          </div>
          <input
            aria-label="Preview timeline"
            type="range"
            min="0"
            max={timelineSeconds}
            step="0.1"
            value={timeSeconds}
            onChange={(event) => setTimelineTime(Number(event.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              className="px-3 py-1.5 text-xs"
              onClick={() => {
                if (!playing && timeSeconds >= timelineSeconds) setTimelineTime(0);
                setPlaying((current) => !current);
              }}
            >
              {playing ? "Pause" : "Play"}
            </Button>
            {[1, 2, 4].map((option) => (
              <Button
                key={option}
                variant={speed === option ? "primary" : "secondary"}
                className="px-3 py-1.5 text-xs"
                onClick={() => setSpeed(option)}
              >
                {option}×
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PreviewSurface({
  item,
  asset,
  url,
  playing,
  speed,
  offsetSeconds,
  loadState,
}: {
  item: PlaybackPreviewItem | null;
  asset: MediaAsset | undefined;
  url: string | undefined;
  playing: boolean;
  speed: number;
  offsetSeconds: number;
  loadState: "idle" | "loading" | "ready" | "error";
}) {
  if (!item) return <Placeholder label="Unbound Zone" />;
  if (!asset) return <Placeholder label={item.label ?? "Missing asset"} />;
  if (!url) return <Placeholder label={loadState === "loading" ? "Loading preview…" : "Preview unavailable"} />;

  const isVideo = asset.kind === "video" || asset.file?.mime_type?.startsWith("video/") || isVideoUrl(url);
  if (isVideo) return <PreviewVideo key={item.mediaAssetId} src={url} playing={playing} speed={speed} offsetSeconds={offsetSeconds} />;
  return <img src={url} alt={asset.title ?? asset.file?.original_filename ?? item.label ?? "Preview asset"} className="h-full w-full object-cover" />;
}

function PreviewVideo({ src, playing, speed, offsetSeconds }: { src: string; playing: boolean; speed: number; offsetSeconds: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.playbackRate = speed;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing, speed, src]);
  useEffect(() => {
    const video = ref.current;
    if (video && (!playing || Math.abs(video.currentTime - offsetSeconds) > 0.35)) video.currentTime = offsetSeconds;
  }, [offsetSeconds, playing, src]);
  return <video ref={ref} src={src} muted playsInline className="h-full w-full object-cover" />;
}

function Placeholder({ label }: { label: string }) {
  return <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-amber-200">{label}</div>;
}
