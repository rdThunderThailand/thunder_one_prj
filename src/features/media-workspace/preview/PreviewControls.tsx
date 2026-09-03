"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MoreIcon } from "@/components/ui/icons";

const SPEED_OPTIONS = [1, 2, 3];

export function PreviewControls({
  conflictCount,
  geometryControls,
  timeSeconds,
  timelineSeconds,
  muted,
  playing,
  speed,
  allowActualSize,
  framePixels,
  fitToWindow,
  isFullscreen,
  placement = "panel",
  onTimeline,
  onPlaying,
  onSpeed,
  onMuted,
  onFitToWindow,
  onFullscreen,
}: {
  conflictCount: number;
  geometryControls: ReactNode;
  timeSeconds: number;
  timelineSeconds: number;
  muted: boolean;
  playing: boolean;
  speed: number;
  allowActualSize: boolean;
  framePixels: [number, number] | null;
  fitToWindow: boolean;
  isFullscreen: boolean;
  placement?: "panel" | "overlay";
  onTimeline: (seconds: number) => void;
  onPlaying: (playing: boolean) => void;
  onSpeed: (speed: number) => void;
  onMuted: (muted: boolean) => void;
  onFitToWindow: (fit: boolean) => void;
  onFullscreen: () => void;
}) {
  const isOverlay = placement === "overlay";
  const secondaryOverlay = isOverlay ? "border-white/20 bg-white/10 !text-white hover:bg-white/20" : "";
  return (
    <div
      className={
        isOverlay
          ? "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-3 pb-3 pt-8 text-white"
          : "rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800"
      }
    >
      {conflictCount > 0 && (
        <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800" role="status">
          Preview shows this draft alone. {conflictCount} other publication{conflictCount === 1 ? "" : "s"} may merge on the same screen.
        </p>
      )}
      {geometryControls}
      <div className={`mb-1.5 flex items-center justify-between gap-3 text-xs ${isOverlay ? "text-white/75" : "text-zinc-500"}`}>
        <span>{isOverlay ? "" : "Shared timeline · all Zones start at 0s"}</span>
        <span>{timeSeconds.toFixed(1)}s / {timelineSeconds}s · {muted ? "muted" : "unmuted"}</span>
      </div>
      <input
        aria-label="Preview timeline"
        type="range"
        min="0"
        max={timelineSeconds}
        step="0.1"
        value={timeSeconds}
        onChange={(event) => onTimeline(Number(event.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          variant="primary"
          className="px-3 py-1.5 text-xs"
          onClick={() => onPlaying(!playing)}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant={muted ? "secondary" : "primary"}
          className={`px-3 py-1.5 text-xs ${muted ? secondaryOverlay : ""}`}
          onClick={() => onMuted(!muted)}
        >
          {muted ? "Unmute" : "Mute"}
        </Button>
        <span className={`text-xs ${isOverlay ? "text-white/75" : "text-zinc-500"}`}>
          {speed}×
        </span>
        <details
          className="relative ml-auto inline-block text-left"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              event.currentTarget.removeAttribute("open");
            }
          }}
        >
          <summary
            aria-label="Playback speed"
            className={`flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg ${
              isOverlay
                ? "text-white hover:bg-white/15"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
            }`}
          >
            <MoreIcon className="h-4 w-4" />
          </summary>
          <div className="absolute bottom-full right-0 z-20 mb-2 w-28 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  speed === option ? "font-semibold text-indigo-600 dark:text-indigo-300" : ""
                }`}
                onClick={() => onSpeed(option)}
              >
                {option}×
              </button>
            ))}
          </div>
        </details>
        {allowActualSize && framePixels && (
          <Button
            variant="secondary"
            className={`px-3 py-1.5 text-xs ${secondaryOverlay}`}
            onClick={() => onFitToWindow(!fitToWindow)}
          >
            {fitToWindow ? `Actual size (${framePixels[0]}×${framePixels[1]})` : "Fit to window"}
          </Button>
        )}
        <Button
          variant="secondary"
          className={`px-3 py-1.5 text-xs ${secondaryOverlay}`}
          onClick={onFullscreen}
        >
          {isFullscreen ? "Exit full screen" : "Full screen"}
        </Button>
      </div>
    </div>
  );
}
