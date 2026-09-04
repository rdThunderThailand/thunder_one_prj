"use client";

import { useEffect, useRef } from "react";
import { isVideoUrl } from "@/lib/media-kind";
import type { MediaAsset } from "@/types/domain";
import type { PlaybackPreviewItem } from "./preview-clock";

export function PreviewSurface({
  item,
  asset,
  url,
  playing,
  speed,
  muted,
  offsetSeconds,
  loadState,
}: {
  item: PlaybackPreviewItem | null;
  asset: MediaAsset | undefined;
  url: string | undefined;
  playing: boolean;
  speed: number;
  muted: boolean;
  offsetSeconds: number;
  loadState: "idle" | "loading" | "ready" | "error";
}) {
  if (!item) return <Placeholder label="Unbound Zone" />;
  if (!asset) return <Placeholder label={item.label ?? "Missing asset"} />;
  if (!url) return <Placeholder label={loadState === "loading" ? "Loading preview…" : "Preview unavailable"} />;

  const isVideo = asset.kind === "video" || asset.file?.mime_type?.startsWith("video/") || isVideoUrl(url);
  if (isVideo) return <PreviewVideo key={item.mediaAssetId} src={url} playing={playing} speed={speed} muted={muted} offsetSeconds={offsetSeconds} />;
  // Blob/signed preview URLs are runtime media surfaces, not optimized page imagery.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={asset.title ?? asset.file?.original_filename ?? item.label ?? "Preview asset"} className="h-full w-full object-cover" />;
}

function PreviewVideo({ src, playing, speed, muted, offsetSeconds }: { src: string; playing: boolean; speed: number; muted: boolean; offsetSeconds: number }) {
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
  return <video ref={ref} src={src} muted={muted} playsInline className="h-full w-full object-cover" />;
}

function Placeholder({ label }: { label: string }) {
  return <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-amber-200">{label}</div>;
}
