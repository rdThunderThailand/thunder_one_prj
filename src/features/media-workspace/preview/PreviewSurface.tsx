"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { isVideoUrl } from "@/lib/media-kind";
import type { MediaAsset } from "@/types/domain";
import type { PlaybackPreviewItem } from "./preview-clock";

const FIT_CLASS: Record<string, string> = { fit: "object-contain", fill: "object-cover", stretch: "object-fill" };

export function PreviewSurface({
  item,
  asset,
  url,
  playing,
  speed,
  muted,
  offsetSeconds,
  loadState,
  defaultMediaFit,
  style,
}: {
  item: PlaybackPreviewItem | null;
  asset: MediaAsset | undefined;
  url: string | undefined;
  playing: boolean;
  speed: number;
  muted: boolean;
  offsetSeconds: number;
  loadState: "idle" | "loading" | "ready" | "error";
  /** Playlist-level fallback (ADR 0062 §6): item override → this → "fit". */
  defaultMediaFit?: string | null;
  style?: CSSProperties;
}) {
  const fitClass = FIT_CLASS[item?.mediaFit ?? defaultMediaFit ?? "fit"] ?? FIT_CLASS.fit;

  if (!item) return <Placeholder label="Unbound Zone" style={style} />;
  if (!asset) return <Placeholder label={item.label ?? "Missing asset"} style={style} />;
  if (!url) return <Placeholder label={loadState === "loading" ? "Loading preview…" : "Preview unavailable"} style={style} />;

  const isVideo = asset.kind === "video" || asset.file?.mime_type?.startsWith("video/") || isVideoUrl(url);
  if (isVideo) {
    return (
      <PreviewVideo
        key={item.mediaAssetId}
        src={url}
        playing={playing}
        speed={speed}
        muted={muted}
        offsetSeconds={offsetSeconds}
        fitClass={fitClass}
        style={style}
      />
    );
  }
  // Blob/signed preview URLs are runtime media surfaces, not optimized page imagery.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={asset.title ?? asset.file?.original_filename ?? item.label ?? "Preview asset"}
      className={`h-full w-full ${fitClass}`}
      style={style}
    />
  );
}

function PreviewVideo({
  src,
  playing,
  speed,
  muted,
  offsetSeconds,
  fitClass,
  style,
}: {
  src: string;
  playing: boolean;
  speed: number;
  muted: boolean;
  offsetSeconds: number;
  fitClass: string;
  style?: CSSProperties;
}) {
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
  return <video ref={ref} src={src} muted={muted} playsInline className={`h-full w-full ${fitClass}`} style={style} />;
}

function Placeholder({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-3 text-center text-xs text-amber-200" style={style}>
      {label}
    </div>
  );
}
