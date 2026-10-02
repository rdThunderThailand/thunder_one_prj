"use client";

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { ExpandIcon, MoreIcon, PlayIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { formatDuration } from "@/features/media-workspace/playlists/duration";

const SPEED_OPTIONS = [1, 2, 3];

export function PreviewControls({
  conflictCount, geometryControls, timeSeconds, timelineSeconds, muted, playing, speed,
  allowActualSize, framePixels, fitToWindow, isFullscreen, placement = "panel",
  bodyRef, portalContainer, onTimeline, onPlaying, onSpeed, onMuted, onFitToWindow, onFullscreen,
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
  placement?: "panel" | "overlay" | "footer";
  bodyRef?: Ref<HTMLDivElement>;
  portalContainer?: HTMLElement | null;
  onTimeline: (seconds: number) => void;
  onPlaying: (playing: boolean) => void;
  onSpeed: (speed: number) => void;
  onMuted: (muted: boolean) => void;
  onFitToWindow: (fit: boolean) => void;
  onFullscreen: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isOverlay = placement === "overlay";
  const isFooter = placement === "footer";
  const isDark = isOverlay || isFooter;
  const controlClass = isDark ? "text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground" : "";
  const mutedText = isDark ? "text-primary-foreground/80" : "text-muted-foreground";
  const timeLabel = isFooter
    ? `${formatDuration(timeSeconds)} / ${formatDuration(timelineSeconds)}`
    : `${Math.floor(timeSeconds)}s / ${Math.floor(timelineSeconds)}s`;
  const overlayVisibility = playing && !isMenuOpen
    ? "translate-y-2 opacity-0 group-hover/preview-stage:translate-y-0 group-hover/preview-stage:opacity-100 group-focus-within/preview-stage:translate-y-0 group-focus-within/preview-stage:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:translate-y-0 [@media(pointer:coarse)]:opacity-100"
    : "translate-y-0 opacity-100";

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => alive && setIsMenuOpen(false));
    return () => { alive = false; };
  }, [placement, portalContainer]);

  return (
    <div
      data-preview-controls={placement}
      className={isOverlay
        ? `absolute inset-x-0 bottom-0 rounded-b-xl border border-transparent bg-gradient-to-t from-foreground/85 via-foreground/70 to-transparent px-3 pb-3 pt-8 text-primary-foreground transition duration-200 motion-reduce:transition-none ${overlayVisibility}`
        : isFooter
          ? "shrink-0 border-t border-primary-foreground/10 px-5 py-3 text-primary-foreground"
          : "rounded-lg border border-border bg-muted p-3"}
    >
      <div ref={bodyRef} className="@container/preview-controls min-w-0">
        {conflictCount > 0 && (
          <p className="mb-3 rounded-md border border-warning/30 bg-warning-soft px-2.5 py-2 text-xs text-warning" role="status">
            Preview shows this draft alone. {conflictCount} other publication{conflictCount === 1 ? "" : "s"} may merge on the same screen.
          </p>
        )}
        {geometryControls}
        <div className="flex min-w-0 flex-col gap-2 @min-[24rem]/preview-controls:flex-row @min-[24rem]/preview-controls:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 @max-[9.5rem]/preview-controls:flex-wrap">
            <Button
              variant="ghost"
              size="icon-sm"
              className={controlClass}
              aria-label={playing ? "Pause preview" : "Play preview"}
              title={playing ? "Pause" : "Play"}
              onClick={() => onPlaying(!playing)}
            >
              {playing ? <PauseGlyph /> : <PlayIcon className="h-4 w-4" />}
            </Button>
            <span className={`min-w-0 max-w-[min(8rem,35%)] shrink truncate text-[11px] tabular-nums @max-[9.5rem]/preview-controls:max-w-[calc(100%-2.5rem)] ${mutedText}`} title={timeLabel} aria-label={timeLabel}>
              {timeLabel}
            </span>
            <input
              aria-label="Preview timeline"
              type="range"
              min="0"
              max={timelineSeconds}
              step="0.1"
              value={timeSeconds}
              onChange={(event) => onTimeline(Number(event.target.value))}
              className="h-1 min-w-0 flex-1 accent-primary @max-[9.5rem]/preview-controls:basis-full"
            />
          </div>
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 @min-[9.5rem]/preview-controls:flex-nowrap">
            <Button
              variant="ghost"
              size="icon-sm"
              className={controlClass}
              aria-label={muted ? "Unmute preview" : "Mute preview"}
              title={muted ? "Unmute" : "Mute"}
              onClick={() => onMuted(!muted)}
            >
              <VolumeGlyph muted={muted} />
            </Button>
            <span className={`text-xs ${mutedText}`} aria-label={`Playback speed ${speed}×`}>
              {speed}×
            </span>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className={controlClass} aria-label="Playback options" title="Playback options">
                  <MoreIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" portalContainer={portalContainer}>
                <DropdownMenuRadioGroup value={String(speed)} onValueChange={(value) => onSpeed(Number(value))}>
                  {SPEED_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option} value={String(option)}>
                      {option}×
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {allowActualSize && framePixels && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => onFitToWindow(!fitToWindow)}>
                      {fitToWindow ? `Actual size (${framePixels[0]}×${framePixels[1]})` : "Fit to window"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon-sm"
              className={controlClass}
              aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
              title={isFullscreen ? "Exit full screen" : "Full screen"}
              onClick={onFullscreen}
            >
              <ExpandIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isFooter && (
          <div className="mt-2 text-right">
            <p className="text-[11px] font-semibold">Preview Mode</p>
            <p className="text-[10px] text-primary-foreground/55">This is a simulation of how your layout will appear on screens.</p>
          </div>
        )}
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
      <path d="M4 10v4h4l5 4H4Z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 4 6m0-6-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16 9.5c1.4 1.4 1.4 3.6 0 5m2-7c2.5 2.5 2.5 6.5 0 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
