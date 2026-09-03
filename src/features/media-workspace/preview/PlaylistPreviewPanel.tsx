"use client";

import { formatDuration } from "@/features/media-workspace/playlists/duration";
import { zoneLoopDurationSeconds, type PlaybackPreviewItem, type PlaybackPreviewSettings, type ZonePreviewFrame } from "./preview-clock";

/** ADR 0061 §6: a sibling of the stage, fed the current frame through `onFrameChange`. It keeps
 *  no clock of its own and has no per-frame progress readout. §7: the values the preview cannot
 *  honour are labelled here, not only in the ADR. */
export function PlaylistPreviewPanel({
  name,
  items,
  playback,
  frame,
}: {
  name: string;
  items: PlaybackPreviewItem[];
  playback?: PlaybackPreviewSettings;
  frame: ZonePreviewFrame | null;
}) {
  const totalSeconds = zoneLoopDurationSeconds(items);
  const nowPlaying = frame?.item ?? null;
  const position = frame?.itemIndex != null ? frame.itemIndex + 1 : null;

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Now Playing</h2>
        {nowPlaying ? (
          <dl className="space-y-2 text-sm">
            <Row label="Item" value={nowPlaying.label ?? "Untitled item"} />
            <Row label="Position" value={position ? `${position} of ${items.length}` : "—"} />
            <Row label="Duration" value={formatDuration(nowPlaying.durationSeconds ?? 0)} />
            <Row label="Transition" value={nowPlaying.transition ?? "—"} />
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">No item playing</p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Playlist Information</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={name || "Playlist"} />
          <Row label="Items" value={String(items.length)} />
          <Row label="Total duration" value={formatDuration(totalSeconds)} />
          <Row label="Play mode" value={playback?.playMode === "shuffle" ? "Shuffle (not simulated)" : "Sequential"} />
          <Row label="Repeat" value={playback?.repeat === "once" ? "Once (preview loops)" : "Loop"} />
          <Row label="Start from" value={playback?.startFrom === "resume" ? "Resume (not simulated)" : "First item"} />
          <Row
            label="Transition"
            value={
              playback?.defaultTransition
                ? `${playback.defaultTransition}${playback.transitionDurationSeconds != null ? ` · ${playback.transitionDurationSeconds}s` : ""} (not simulated)`
                : "— (not simulated)"
            }
          />
        </dl>
        <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          Preview plays items in order with their durations. Play mode, repeat, start-from and
          transitions are stated, not played.
        </p>
      </section>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-100">{value}</dd>
    </div>
  );
}
