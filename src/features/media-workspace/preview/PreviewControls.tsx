"use client";

import type { ReactNode } from "react";
import { ExpandIcon, MoreIcon, PlayIcon } from "@/components/ui/icons";

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
  const controlClass = `flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30 ${
    isOverlay ? "text-white hover:bg-card/15" : "text-muted-foreground hover:bg-muted"
  }`;
  const overlayVisibility = playing
    ? "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
    : "translate-y-0 opacity-100";
  return (
    <div
      className={
        isOverlay
          ? `absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-3 pb-3 pt-8 text-white transition duration-200 motion-reduce:transition-none ${overlayVisibility}`
          : "rounded-lg border border-border bg-muted p-3"
      }
    >
      {conflictCount > 0 && (
        <p className="mb-3 rounded-md border border-warning/30 bg-warning-soft px-2.5 py-2 text-xs text-warning" role="status">
          Preview shows this draft alone. {conflictCount} other publication{conflictCount === 1 ? "" : "s"} may merge on the same screen.
        </p>
      )}
      {geometryControls}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={controlClass}
          aria-label={playing ? "Pause preview" : "Play preview"}
          title={playing ? "Pause" : "Play"}
          onClick={() => onPlaying(!playing)}
        >
          {playing ? <PauseGlyph /> : <PlayIcon className="h-4 w-4" />}
        </button>
        <span className={`shrink-0 text-[11px] tabular-nums ${isOverlay ? "text-white/80" : "text-muted-foreground"}`}>
          {Math.floor(timeSeconds)}s / {Math.floor(timelineSeconds)}s
        </span>
        <input
          aria-label="Preview timeline"
          type="range"
          min="0"
          max={timelineSeconds}
          step="0.1"
          value={timeSeconds}
          onChange={(event) => onTimeline(Number(event.target.value))}
          className="h-1 min-w-20 flex-1 accent-primary"
        />
        <button
          type="button"
          className={controlClass}
          aria-label={muted ? "Unmute preview" : "Mute preview"}
          title={muted ? "Unmute" : "Mute"}
          onClick={() => onMuted(!muted)}
        >
          <VolumeGlyph muted={muted} />
        </button>
        <span className={`text-xs ${isOverlay ? "text-white/75" : "text-muted-foreground"}`}>
          {speed}×
        </span>
        <details
          className="relative inline-block shrink-0 text-left"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              event.currentTarget.removeAttribute("open");
            }
          }}
        >
          <summary
            aria-label="Playback speed"
            title="Playback options"
            className={`${controlClass} cursor-pointer list-none`}
          >
            <MoreIcon className="h-4 w-4" />
          </summary>
          <div className="absolute bottom-full right-0 z-20 mb-2 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 text-foreground shadow-lg">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  speed === option ? "font-semibold text-primary" : ""
                }`}
                onClick={() => onSpeed(option)}
              >
                {option}×
              </button>
            ))}
            {allowActualSize && framePixels && (
              <button
                type="button"
                className="block w-full border-t border-border px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => onFitToWindow(!fitToWindow)}
              >
                {fitToWindow ? `Actual size (${framePixels[0]}×${framePixels[1]})` : "Fit to window"}
              </button>
            )}
          </div>
        </details>
        <button
          type="button"
          className={controlClass}
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
          onClick={onFullscreen}
        >
          <ExpandIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PauseGlyph() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      <span className="h-3.5 w-1 rounded-sm bg-current" />
      <span className="h-3.5 w-1 rounded-sm bg-current" />
    </span>
  );
}

function VolumeGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6l-5 4H4Z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 4 6m0-6-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 9.5c1.4 1.4 1.4 3.6 0 5m2-7c2.5 2.5 2.5 6.5 0 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
