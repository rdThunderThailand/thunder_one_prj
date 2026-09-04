"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deviceFit, parseAspectRatio } from "@/features/media-workspace/layouts/geometry";
import { fetchPreviewUrls } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { PreviewControls } from "./PreviewControls";
import { PreviewSurface } from "./PreviewSurface";
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
  controlsPlacement?: "panel" | "overlay";
  frameViewportHeight?: string;
}) {
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [geometryId, setGeometryId] = useState<string | null>(null);
  const [fitToWindow, setFitToWindow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [urls, setUrls] = useState<Record<string, string | undefined>>({});
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
  // An explicit width, never a stretched one: the frame's only in-flow content is absolutely
  // positioned, so in the full-screen flex column it would otherwise collapse to nothing. Fitting
  // derives the width from the height budget so the aspect ratio survives the clamp.
  const frameWidth = fitToWindow || !framePixels
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

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void stageRef.current?.requestFullscreen?.().catch(() => undefined);
  };

  const setTimelineTime = (next: number) => {
    setTimeSeconds(next);
    initialTime.current = next;
    startedAt.current = performance.now();
  };
  const geometryControls = geometryOptions.length > 0 ? (
    <div className="mb-3 space-y-2">
      <label className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Preview shape</span>
        <select
          value={selectedGeometry?.id ?? ""}
          onChange={(event) => setGeometryId(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {geometryOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <span>· frame {frameAspectRatio}</span>
      </label>
      {geometryFit === "unknown" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800" role="status">
          These targets report no screen geometry. Previewing at {frameAspectRatio} from the Layout instead.
        </p>
      )}
      {(geometryFit === "orientation-mismatch" || geometryFit === "aspect-mismatch") && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800" role="status">
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
      isFullscreen={isFullscreen}
      placement={controlsPlacement}
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
    <div ref={stageRef} className={isFullscreen ? "flex h-screen flex-col justify-center gap-4 bg-black p-4" : "space-y-4"}>
      <div className="overflow-auto">
        <div
          className="mx-auto overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-inner"
          style={{ aspectRatio: `${ratioWidth} / ${ratioHeight}`, width: frameWidth }}
        >
        <div className="relative h-full w-full">
          {resolvedZones.map((zone, zoneIndex) => {
            const frame = previewFrameAt(schedules[zoneIndex], zone.items, timeSeconds);
            const zoneTimeSeconds = frame.ended
              ? frame.loopDurationSeconds
              : frame.loopDurationSeconds > 0
                ? timeSeconds % frame.loopDurationSeconds
                : 0;
            const transition = frame.transition;
            return (
              <div
                key={zone.id}
                className="absolute overflow-hidden border border-white/25 bg-zinc-950"
                style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
              >
                <div className="relative h-full w-full">
                  {/* ADR 0062 §5: both surfaces mount for the width of the fade, opacity a pure
                     function of `frame.transition.progress` — never a CSS mount animation. The
                     outgoing surface never plays; it holds its frozen last frame. */}
                  {transition && (
                    <PreviewSurface
                      key={`out-${transition.outgoingIndex}`}
                      item={transition.outgoingItem}
                      asset={assetsById[transition.outgoingItem.mediaAssetId]}
                      url={urls[transition.outgoingItem.mediaAssetId]}
                      playing={false}
                      speed={speed}
                      muted={muted}
                      offsetSeconds={transition.outgoingOffsetSeconds}
                      loadState={previewLoadState}
                      defaultMediaFit={zone.playback?.mediaFit}
                      style={{ position: "absolute", inset: 0, opacity: 1 - transition.progress }}
                    />
                  )}
                  <PreviewSurface
                    key={frame.itemIndex ?? "empty"}
                    item={frame.item}
                    asset={frame.item ? assetsById[frame.item.mediaAssetId] : undefined}
                    url={frame.item ? urls[frame.item.mediaAssetId] : undefined}
                    playing={transition ? false : playing}
                    speed={speed}
                    muted={muted}
                    offsetSeconds={frame.offsetSeconds}
                    loadState={previewLoadState}
                    defaultMediaFit={zone.playback?.mediaFit}
                    style={transition ? { position: "absolute", inset: 0, opacity: transition.progress } : undefined}
                  />
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-2 py-1 text-[10px] font-medium text-white">
                  <span>{zone.name}</span>
                  <span>
                    {frame.ended
                      ? "Ended"
                      : frame.loopDurationSeconds
                        ? `${Math.floor(zoneTimeSeconds)}s / ${Math.floor(frame.loopDurationSeconds)}s`
                        : "Needs duration"}
                  </span>
                </div>
              </div>
            );
          })}
          {resolvedZones.length === 0 && <div className="flex h-full items-center justify-center text-sm text-zinc-400">No Zones to preview</div>}
          {controlsPlacement === "overlay" && controls}
          </div>
        </div>
      </div>

      {controlsPlacement === "panel" && controls}
    </div>
  );
}
