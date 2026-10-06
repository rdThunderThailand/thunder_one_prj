"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deviceFit, parseAspectRatio } from "@/features/media-workspace/layouts/geometry";
import { fetchPreviewUrls } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { PreviewControls } from "./PreviewControls";
import { PreviewZones } from "./PreviewZones";
import { usePreviewControlsLayout } from "./use-preview-controls-layout";
import { previewFrameAt, zoneSchedule, type PlaybackPreviewZone, type ZonePreviewFrame, type ZoneSchedule } from "./preview-clock";
import { defaultGeometry, resolveFrameAspectRatio, resolveFramePixels, type GeometryOption } from "./preview-geometry";

export type { PlaybackPreviewItem, PlaybackPreviewSettings, PlaybackPreviewZone } from "./preview-clock";

const EMPTY_PREVIEW_URLS: Record<string, string | undefined> = {};
const EMPTY_GEOMETRY_OPTIONS: GeometryOption[] = [];

export function PreviewStage({
  zones,
  assets,
  aspectRatio = "16:9",
  conflictCount = 0,
  previewUrls = EMPTY_PREVIEW_URLS,
  active = true,
  geometryOptions = EMPTY_GEOMETRY_OPTIONS,
  referenceResolution = null,
  allowActualSize = true,
  onFrameChange,
  seekRequest,
  controlsPlacement = "panel",
  frameViewportHeight = "70vh",
  fillWidth = false,
}: {
  zones: PlaybackPreviewZone[];
  assets: MediaAsset[];
  /** The shape the content was authored in — the baseline a chosen geometry is judged against. */
  aspectRatio?: string;
  conflictCount?: number;
  previewUrls?: Record<string, string | undefined>;
  active?: boolean;
  /** Shapes this host can offer. Empty renders no selector, which is how the Playlist review
   *  step keeps the behaviour it had before Ticket 20. */
  geometryOptions?: GeometryOption[];
  /** The Layout's Authoring Reference Resolution, used to shape the frame when the chosen
   *  target reports no geometry of its own. `null` on a legacy Layout (ADR 0050). */
  referenceResolution?: string | null;
  /** ADR 0061 §5: a Playlist has no pixels, so its host passes `false` to hide the
   *  "Actual size" control rather than assert a resolution the Playlist does not have. */
  allowActualSize?: boolean;
  /** ADR 0061 §6: fires when the displayed frame's identity or metadata changes — never on
   *  `offsetSeconds` alone. `null` unless the preview holds exactly one Zone. */
  onFrameChange?: (frame: ZonePreviewFrame | null) => void;
  /** External scrubber target, used by Playlist filmstrip clicks to jump to an item's start. */
  seekRequest?: { seconds: number; id: number } | null;
  /** `footer`: the frame fills the host and the controls sit in a flat bar under it (the
   *  Lovable preview dialog). */
  controlsPlacement?: "panel" | "overlay" | "footer";
  frameViewportHeight?: string;
  /** Stretch the frame to the host's full width instead of deriving width from
   *  `frameViewportHeight` — the aspect ratio still governs height (CSS `aspect-ratio`), so
   *  non-16:9 content still pillarboxes/letterboxes inside the wider box. Opt-in per host;
   *  default keeps every other `PreviewStage` call site unchanged. */
  fillWidth?: boolean;
}) {
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [geometryId, setGeometryId] = useState<string | null>(null);
  const [fitToWindow, setFitToWindow] = useState(true);
  const { stageRef, frameRef, controlsBodyRef, canOverlay, fullscreenContext, toggleFullscreen } = usePreviewControlsLayout(controlsPlacement === "overlay");
  const isFullscreen = fullscreenContext.isStageFullscreen;
  const [urls, setUrls] = useState<Record<string, string | undefined>>({});
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string | undefined>>({});
  const [previewLoadState, setPreviewLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const startedAt = useRef<number | null>(null);
  const initialTime = useRef(0);
  const lastSeekRequestId = useRef(seekRequest?.id);

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
  // ADR 0062 §1: one schedule per Zone, computed once and read by the clock, the frames and the
  // corner badge alike. Seeded by the Zone id so shuffle reproduces identically (§2).
  const schedules: ZoneSchedule[] = useMemo(
    () => resolvedZones.map((zone) => zoneSchedule(zone.items, zone.playback, zone.id)),
    [resolvedZones],
  );
  const timelineSeconds = Math.max(1, ...schedules.map((schedule) => schedule.totalSeconds));
  // ADR 0062 §3: the clock wraps when ANY Zone is `loop` — a single-Zone Playlist on `loop` must
  // keep playing, not stop after one cycle. Every Zone being `once` is the only case that stops.
  const anyZoneLoops = schedules.some((schedule) => schedule.repeat === "loop");

  // ADR 0061 §6: the panels are a sibling fed this frame; the stage keeps the only clock.
  const singleZoneFrame = resolvedZones.length === 1 ? previewFrameAt(schedules[0], resolvedZones[0].items, timeSeconds) : null;
  // `transition.progress` advances every animation frame and must never enter this key, or
  // onFrameChange re-renders the host ~60x/second (ADR 0061 §6).
  const singleZoneFrameKey = singleZoneFrame
    ? JSON.stringify({
        index: singleZoneFrame.itemIndex,
        item: singleZoneFrame.item,
        ended: singleZoneFrame.ended,
        outgoingIndex: singleZoneFrame.transition?.outgoingIndex ?? null,
      })
    : null;

  // Derived, never an effect: the option list arrives asynchronously in every host, and resetting
  // the selection from an effect is both a cascading render and a flash of the wrong frame.
  const selectedGeometry = geometryOptions.find((option) => option.id === geometryId) ?? defaultGeometry(geometryOptions);
  const frameAspectRatio = resolveFrameAspectRatio(selectedGeometry, referenceResolution, aspectRatio);
  const [ratioWidth, ratioHeight] = parseAspectRatio(frameAspectRatio) ?? [16, 9];
  // Advisory only, never a block (ADR 0055): the frame takes the target's shape and percentage
  // Zones stretch into it; PreviewSurface resolves each item's own media_fit inside that box.
  const geometryFit = selectedGeometry ? deviceFit(selectedGeometry.resolution, aspectRatio) : "fits";
  const framePixels = resolveFramePixels(selectedGeometry, referenceResolution);
  const frameWidth = fillWidth && !isFullscreen
    ? "100%"
    : fitToWindow || !framePixels
      ? `min(100%, calc(${isFullscreen ? "82vh" : frameViewportHeight} * ${ratioWidth} / ${ratioHeight}))`
      : `${framePixels[0]}px`;

  // ponytail: promise chain, not a direct call — react-hooks/set-state-in-effect flags any
  // setState called synchronously in an effect body, same workaround as AssetLibraryStep.
  useEffect(() => {
    if (!active) return;
    Promise.resolve().then(() => {
      setTimeSeconds(0);
      setPlaying(false);
      setSpeed(1);
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const missingAssetIds = assetIds.filter((id) => !previewUrls[id]);
    Promise.resolve().then(() => setUrls(previewUrls));
    if (missingAssetIds.length === 0) {
      Promise.resolve().then(() => setPreviewLoadState("ready"));
      return;
    }
    let alive = true;
    Promise.resolve().then(() => setPreviewLoadState("loading"));
    fetchPreviewUrls(missingAssetIds)
      .then((result) => {
        if (!alive) return;
        setUrls((current) => ({ ...current, ...result.urls }));
        setThumbnailUrls((current) => ({ ...current, ...result.thumbnailUrls }));
        setPreviewLoadState("ready");
      })
      .catch(() => alive && setPreviewLoadState("error"));
    return () => {
      alive = false;
    };
  }, [assetIds, active, previewUrls]);

  useEffect(() => {
    if (!playing) return;
    initialTime.current = timeSeconds;
    startedAt.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const raw = initialTime.current + ((now - (startedAt.current ?? now)) / 1000) * speed;
      setTimeSeconds(anyZoneLoops && timelineSeconds > 0 ? raw % timelineSeconds : Math.min(timelineSeconds, raw));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, timelineSeconds, anyZoneLoops]);

  useEffect(() => {
    if (!anyZoneLoops && timeSeconds >= timelineSeconds && playing) Promise.resolve().then(() => setPlaying(false));
  }, [anyZoneLoops, playing, timeSeconds, timelineSeconds]);

  useEffect(() => {
    if (!seekRequest || seekRequest.id === lastSeekRequestId.current) return;
    lastSeekRequestId.current = seekRequest.id;
    Promise.resolve().then(() => {
      setTimeSeconds(seekRequest.seconds);
      initialTime.current = seekRequest.seconds;
      startedAt.current = performance.now();
    });
  }, [seekRequest]);

  // ponytail: same deferred-call pattern as above — onFrameChange sets state in the host.
  useEffect(() => {
    if (!onFrameChange) return;
    Promise.resolve().then(() => onFrameChange(singleZoneFrame));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleZoneFrameKey, onFrameChange]);

  const setTimelineTime = (next: number) => {
    setTimeSeconds(next);
    initialTime.current = next;
    startedAt.current = performance.now();
  };
  const controlsPosition = controlsPlacement === "overlay" && !canOverlay ? "panel" : controlsPlacement;
  const geometryControls = geometryOptions.length > 0 ? (
    <div className="mb-3 space-y-2">
      <label className={`flex flex-wrap items-center gap-2 text-xs ${controlsPosition === "panel" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
        <span>Preview shape</span>
        <select
          value={selectedGeometry?.id ?? ""}
          onChange={(event) => setGeometryId(event.target.value)}
          className="min-w-0 max-w-full rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
        >
          {geometryOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <span>· frame {frameAspectRatio}</span>
      </label>
      {geometryFit === "unknown" && (
        <p className="rounded-md border border-warning/30 bg-warning-soft px-2.5 py-2 text-xs text-warning" role="status">
          These targets report no screen geometry. Previewing at {frameAspectRatio} from the Layout instead.
        </p>
      )}
      {(geometryFit === "orientation-mismatch" || geometryFit === "aspect-mismatch") && (
        <p className="rounded-md border border-warning/30 bg-warning-soft px-2.5 py-2 text-xs text-warning" role="status">
          This target is a different shape from the Layout ({aspectRatio}). Zones stretch to fill it — check the framing before publishing.
        </p>
      )}
    </div>
  ) : null;

  const controls = (
    <PreviewControls
      conflictCount={conflictCount}
      geometryControls={geometryControls}
      timeSeconds={timeSeconds}
      timelineSeconds={timelineSeconds}
      muted={muted}
      playing={playing}
      speed={speed}
      allowActualSize={allowActualSize}
      framePixels={framePixels}
      fitToWindow={fitToWindow}
      isFullscreen={fullscreenContext.owner !== null}
      placement={controlsPosition}
      bodyRef={controlsBodyRef}
      portalContainer={fullscreenContext.owner}
      onTimeline={setTimelineTime}
      onPlaying={(next) => {
        if (next && timeSeconds >= timelineSeconds) setTimelineTime(0);
        setPlaying(next);
      }}
      onSpeed={setSpeed}
      onMuted={setMuted}
      onFitToWindow={setFitToWindow}
      onFullscreen={toggleFullscreen}
    />
  );

  return (
    <div ref={stageRef} className={isFullscreen ? "flex h-screen flex-col justify-center gap-4 bg-foreground p-4" : controlsPlacement === "footer" ? "flex h-full min-h-0 flex-col" : "space-y-4"}>
      <div className={controlsPlacement === "footer" && !isFullscreen ? "flex min-h-0 flex-1 items-center justify-center overflow-auto p-8" : "overflow-auto"}>
        <div
          className="group/preview-stage relative mx-auto"
          style={{ width: frameWidth }}
        >
          <div
            ref={frameRef}
            className="relative w-full overflow-hidden rounded-xl border border-border bg-foreground shadow-inner"
            style={{ aspectRatio: `${ratioWidth} / ${ratioHeight}` }}
          >
            <PreviewZones
              zones={resolvedZones}
              schedules={schedules}
              assetsById={assetsById}
              urls={urls}
              thumbnailUrls={thumbnailUrls}
              timeSeconds={timeSeconds}
              playing={playing}
              speed={speed}
              muted={muted}
              loadState={previewLoadState}
            />
            {resolvedZones.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No Zones to preview
              </div>
            )}
          </div>
          {controlsPlacement === "overlay" && controls}
        </div>
      </div>

      {controlsPlacement !== "overlay" && controls}
    </div>
  );
}
