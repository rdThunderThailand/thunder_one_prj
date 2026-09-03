"use client";

import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { formatDuration } from "@/features/media-workspace/playlists/duration";
import type { MediaAsset } from "@/types/domain";
import { zoneLoopDurationSeconds, type PlaybackPreviewItem, type PlaybackPreviewSettings, type ZonePreviewFrame } from "./preview-clock";

/** ADR 0061 §6: a sibling of the stage, fed the current frame through `onFrameChange`. It keeps
 *  no clock of its own and has no per-frame progress readout. §7: the values the preview cannot
 *  honour are labelled here, not only in the ADR. */
export function PlaylistPreviewPanel({
  name,
  items,
  playback,
  frame,
  assets = [],
  tone = "dark",
}: {
  name: string;
  items: PlaybackPreviewItem[];
  playback?: PlaybackPreviewSettings;
  frame: ZonePreviewFrame | null;
  assets?: MediaAsset[];
  tone?: "light" | "dark";
}) {
  const totalSeconds = zoneLoopDurationSeconds(items);
  const nowPlaying = frame?.item ?? null;
  const position = frame?.itemIndex != null ? frame.itemIndex + 1 : null;
  const asset = nowPlaying ? assets.find((item) => item.id === nowPlaying.mediaAssetId) : undefined;
  const previews = usePreviewUrls(nowPlaying ? [nowPlaying.mediaAssetId] : []);
  const section = tone === "light"
    ? "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    : "rounded-xl border border-zinc-800 bg-zinc-900 p-4";
  const labelClass = tone === "light" ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500";
  const valueClass = tone === "light" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-100";

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      <section className={section}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Now Playing</h2>
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
          <p className="text-sm text-zinc-500">No item playing</p>
        )}
      </section>

      <section className={section}>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Playlist Information</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={name || "Playlist"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Items" value={String(items.length)} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Total duration" value={formatDuration(totalSeconds)} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Play mode" value={playback?.playMode === "shuffle" ? "Shuffle" : "Sequential"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Repeat" value={playback?.repeat === "once" ? "Once" : "Repeat All"} labelClass={labelClass} valueClass={valueClass} />
          <Row label="Start from" value={playback?.startFrom === "resume" ? "Resume" : "First item"} labelClass={labelClass} valueClass={valueClass} />
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
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Preview Mode</h2>
        <div className="grid grid-cols-3 gap-2">
          {["16:9", "9:16", "4:3"].map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={mode !== "16:9"}
              className={`rounded-lg border px-2 py-3 text-center text-xs font-medium ${
                mode === "16:9"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-zinc-200 text-zinc-400 dark:border-zinc-700"
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
