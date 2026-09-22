"use client";

import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { formatDuration } from "@/features/media-workspace/playlists/duration";
import type { MediaAsset } from "@/types/domain";
import { type PlaybackPreviewItem, type PlaybackPreviewSettings, type ZonePreviewFrame } from "./preview-clock";

/** ADR 0061 §6: a sibling of the stage, fed the current frame through `onFrameChange`. It keeps
 *  no clock of its own and has no per-frame progress readout. §7: the values the preview cannot
 *  honour are labelled here, not only in the ADR. */
export function PlaylistPreviewPanel({
  name,
  items,
  playback,
  totalSeconds,
  frame,
  assets = [],
  tone = "dark",
  previewMode = "16:9",
  onPreviewMode,
}: {
  name: string;
  items: PlaybackPreviewItem[];
  playback?: PlaybackPreviewSettings;
  /** ADR 0062 §1: the Zone's schedule owns this, so the panel is told rather than re-summing. */
  totalSeconds: number;
  frame: ZonePreviewFrame | null;
  assets?: MediaAsset[];
  tone?: "light" | "dark";
  previewMode?: string;
  onPreviewMode?: (mode: string) => void;
}) {
  const nowPlaying = frame?.item ?? null;
  const position = frame?.itemIndex != null ? frame.itemIndex + 1 : null;
  const asset = nowPlaying ? assets.find((item) => item.id === nowPlaying.mediaAssetId) : undefined;
  const previews = usePreviewUrls(nowPlaying ? [nowPlaying.mediaAssetId] : []);
  const section = tone === "light"
    ? "rounded-xl border border-border bg-card p-4 shadow-sm"
    : "border-t border-background/15 py-4 first:border-t-0 first:pt-0";
  const labelClass = tone === "light" ? "text-muted-foreground" : "text-muted-foreground";
  const valueClass = tone === "light" ? "text-foreground" : "text-background";

  return (
    <aside className="flex w-full flex-col lg:w-80">
      <section className={section}>
        <h2 className={`mb-3 text-sm font-semibold ${valueClass}`}>Now Playing</h2>
        {nowPlaying ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <MediaThumb
                url={previews.urls[nowPlaying.mediaAssetId]}
                kind={asset?.kind}
                alt={nowPlaying.label ?? "Now playing"}
                className="h-14 w-20"
              />
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${valueClass}`}>{nowPlaying.label ?? "Untitled item"}</p>
                <p className={labelClass}>{asset?.kind === "video" ? "Video" : "Image"} · {formatDuration(nowPlaying.durationSeconds ?? 0)}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Position" value={position ? `${position} of ${items.length}` : "—"} labelClass={labelClass} valueClass={valueClass} />
              <Row label="Duration" value={formatDuration(nowPlaying.durationSeconds ?? 0)} labelClass={labelClass} valueClass={valueClass} />
              <Row label="Transition" value={nowPlaying.transition ?? "—"} labelClass={labelClass} valueClass={valueClass} />
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No item playing</p>
        )}
      </section>

      <section className={section}>
        <h2 className={`mb-3 text-sm font-semibold ${valueClass}`}>Playlist Information</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={name || "Playlist"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Items" value={String(items.length)} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Total duration" value={formatDuration(totalSeconds)} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Play mode" value={playback?.playMode === "shuffle" ? "Shuffle" : "Sequential"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Repeat" value={playback?.repeat === "once" ? "Once" : "Repeat All"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Start from" value={playback?.startFrom === "resume" ? "Resume · previews from first" : "First item"} labelClass={labelClass} valueClass={valueClass} />
          <Row
            label="Transition"
            value={
              playback?.defaultTransition
                ? `${playback.defaultTransition}${playback.transitionDurationSeconds != null ? ` · ${playback.transitionDurationSeconds}s` : ""}`
                : "—"
            }
            labelClass={labelClass}
            valueClass={valueClass}
          />
        </dl>
      </section>

      <section className={section}>
        <h2 className={`mb-3 text-sm font-semibold ${valueClass}`}>Preview Mode</h2>
        <div className="grid grid-cols-3 gap-2">
          {["16:9", "9:16", "4:3"].map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={mode === previewMode}
              onClick={() => onPreviewMode?.(mode)}
              className={`rounded-lg border px-2 py-3 text-center text-xs font-medium ${
                mode === previewMode
                  ? "border-primary bg-primary-soft text-primary"
                  : tone === "light"
                    ? "border-border text-muted-foreground hover:border-border"
                    : "border-background/20 text-background/70 hover:border-background/50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Row({ label, value, labelClass, valueClass }: { label: string; value: string; labelClass: string; valueClass: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={labelClass}>{label}</dt>
      <dd className={`text-right font-medium ${valueClass}`}>{value}</dd>
    </div>
  );
}
