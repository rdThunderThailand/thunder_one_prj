"use client";

// The drag-resize surface. Coordinates never leave percent — the container's CSS
// aspect-ratio makes it the same shape the display will be, so a pointer delta divided
// by the container's own measured box is already the right unit, with no px/frame
// conversion layer to get wrong (docs/layouts/plan-layout-execution.md Task 7 Step 2).

import { useEffect, useRef, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ExpandIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { fitCanvasSize, parseAspectRatio, parseResolution, referencePixels, roundPercent, validateZones } from "../geometry";
import type { LayoutZone } from "../types";
import { computeNextRect, snapDelta, snapTargets, type SnapHandle as Handle } from "../zone-snap";

/** How close (screen px) an edge must come to another edge before it sticks; Alt bypasses. */
const SNAP_DISTANCE_PX = 8;

const RESIZE_HANDLES: { handle: Handle; className: string }[] = [
  { handle: "nw", className: "-left-1 -top-1 cursor-nwse-resize" },
  { handle: "n", className: "left-1/2 -top-1 -translate-x-1/2 cursor-ns-resize" },
  { handle: "ne", className: "-right-1 -top-1 cursor-nesw-resize" },
  { handle: "e", className: "-right-1 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { handle: "se", className: "-right-1 -bottom-1 cursor-nwse-resize" },
  { handle: "s", className: "left-1/2 -bottom-1 -translate-x-1/2 cursor-ns-resize" },
  { handle: "sw", className: "-left-1 -bottom-1 cursor-nesw-resize" },
  { handle: "w", className: "-left-1 top-1/2 -translate-y-1/2 cursor-ew-resize" },
];

export function LayoutCanvas({
  zones,
  background,
  aspectRatio,
  referenceResolution = null,
  zonePreviews = {},
  selectedIndex,
  lockedZoneIds = new Set(),
  hiddenZoneIds = new Set(),
  onSelectIndex,
  onChangeStart,
  onChange,
  fillAvailable = false,
}: {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  referenceResolution?: string | null;
  zonePreviews?: Record<string, { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string; mediaFit?: "fit" | "fill" | "stretch" }>;
  selectedIndex: number | null;
  lockedZoneIds?: ReadonlySet<string>;
  hiddenZoneIds?: ReadonlySet<string>;
  onSelectIndex: (index: number | null) => void;
  onChangeStart?: () => boolean;
  onChange: (zones: LayoutZone[]) => void;
  /** Composition editor mode: fill its bounded workspace and expose native zoom controls. */
  fillAvailable?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const gridVisible = snap || showGrid;
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  // 70vh is a page-layout guess that's wrong once real content (page header, template
  // rail, other cards) sits above the canvas — measure the actual remaining viewport height
  // from where the canvas starts, so a portrait resolution never needs a page scroll to see
  // the whole frame (Ticket 19 item 4, found wrong in browser verification).
  const [maxHeightPx, setMaxHeightPx] = useState<number | null>(null);
  useEffect(() => {
    if (fillAvailable) return;
    const recompute = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      setMaxHeightPx(Math.max(200, window.innerHeight - top - 24));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [fillAvailable]);
  useEffect(() => {
    if (!fillAvailable || !viewportRef.current) return;
    const viewport = viewportRef.current;
    const recompute = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fillAvailable]);
  const drag = useRef<{
    index: number;
    handle: Handle;
    startClientX: number;
    startClientY: number;
    startZone: LayoutZone;
    containerWidth: number;
    containerHeight: number;
    targets: { x: number[]; y: number[] };
  } | null>(null);

  const [ratioW, ratioH] = parseAspectRatio(aspectRatio) ?? [16, 9];
  const fitted = viewportSize.width && viewportSize.height
    ? fitCanvasSize(viewportSize.width, viewportSize.height, ratioW, ratioH)
    : null;
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  const errors = validateZones(zones);
  const overlapping = new Set(
    errors.flatMap((e) => (e.kind === "overlap" ? [e.a, e.b] : []))
  );

  const startDrag = (index: number, handle: Handle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelectIndex(index);
    if (zones[index]?.id && lockedZoneIds.has(zones[index].id)) return;
    if (onChangeStart && !onChangeStart()) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = {
      index,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startZone: zones[index]!,
      containerWidth: rect.width,
      containerHeight: rect.height,
      // Hidden Zones are off the canvas, so nothing sticks to them; locked ones still count.
      targets: snapTargets(zones.filter((zone, i) => i !== index && !hiddenZoneIds.has(zone.id ?? ""))),
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleMove = (e: PointerEvent) => {
    const state = drag.current;
    if (!state) return;
    const rawDx = ((e.clientX - state.startClientX) / state.containerWidth) * 100;
    const rawDy = ((e.clientY - state.startClientY) / state.containerHeight) * 100;
    const snapped = e.altKey
      ? { dx: rawDx, dy: rawDy, guideX: null, guideY: null }
      : snapDelta(state.startZone, state.handle, rawDx, rawDy, state.targets, {
        x: (SNAP_DISTANCE_PX / state.containerWidth) * 100,
        y: (SNAP_DISTANCE_PX / state.containerHeight) * 100,
      });
    setGuides({ x: snapped.guideX, y: snapped.guideY });
    // An edge stuck to another Zone wins over the grid; grid rounding would pull it off again.
    const gridRound = snap ? Math.round : roundPercent;
    const nextRect = computeNextRect(
      state.startZone, state.handle, snapped.dx, snapped.dy,
      snapped.guideX === null ? gridRound : roundPercent,
      snapped.guideY === null ? gridRound : roundPercent,
    );
    onChange(zones.map((z, i) => (i === state.index ? { ...z, ...nextRect } : z)));
  };

  const handleUp = () => {
    drag.current = null;
    setGuides({ x: null, y: null });
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  return (
    <div className={`flex flex-col gap-2 ${fillAvailable ? "min-h-0 flex-1" : ""}`}>
      {fillAvailable ? (
        <div className="flex justify-between px-1 text-[10px] text-muted-foreground" aria-hidden="true">
          <span>0</span><span>480</span><span>960</span><span>1440</span><span>1920</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Canvas</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowGrid((v) => !v)} aria-pressed={showGrid} className={`rounded-lg border px-3 py-1 text-xs font-medium ${showGrid ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>Show grid</button>
            <button type="button" onClick={() => setSnap((v) => !v)} aria-pressed={snap} className={`rounded-lg border px-3 py-1 text-xs font-medium ${snap ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>Snap to grid</button>
          </div>
        </div>
      )}

      <div ref={viewportRef} className={fillAvailable ? "flex min-h-0 flex-1 overflow-auto rounded-xl bg-muted" : ""}>
      <div
        ref={containerRef}
        onClick={() => onSelectIndex(null)}
        className="relative m-auto w-full shrink-0 select-none overflow-hidden rounded-lg border border-border"
        style={{
          aspectRatio: `${ratioW} / ${ratioH}`,
          // Bounded on both axes: capped at 42rem wide (the old max-w-2xl) OR whatever
          // width keeps the height under the measured remaining viewport space, whichever
          // is smaller — a portrait ratio like 1080x1920 no longer scrolls the page.
          ...(fillAvailable && fitted
            ? { width: fitted.width * zoom, height: fitted.height * zoom, maxWidth: "none" }
            : { maxWidth: `min(42rem, calc(${maxHeightPx ?? 500}px * ${ratioW} / ${ratioH}))` }),
          backgroundColor: background,
          backgroundImage: gridVisible
            ? "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)"
            : undefined,
          backgroundSize: gridVisible ? "10% 10%" : undefined,
        }}
      >
        {zones.map((zone, index) => hiddenZoneIds.has(zone.id ?? "") ? null : (
          <div
            key={zone.id ?? index}
            onPointerDown={startDrag(index, "move")}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIndex(index);
            }}
            // Lovable `layout-editor` zone treatment: an outline over the layout background, dashed
            // while the Zone shows no content, primary + ring once selected (ADR 0076).
            className={`absolute border-2 transition-[box-shadow,border-color] ${zone.id && lockedZoneIds.has(zone.id) ? "cursor-default" : "cursor-move"} ${
              selectedIndex === index ? "z-10 border-primary ring-2 ring-primary/30" : "border-primary-foreground/35 hover:border-primary/70"
            } ${selectedIndex !== index && !(zone.id && zonePreviews[zone.id]) ? "border-dashed" : ""} ${
              overlapping.has(index) ? "outline outline-2 outline-error" : ""
            }`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            }}
          >
            {zone.id && zonePreviews[zone.id] && (
              <MediaThumb
                url={zonePreviews[zone.id].url}
                thumbnailUrl={zonePreviews[zone.id].thumbnailUrl}
                kind={zonePreviews[zone.id].kind}
                mimeType={zonePreviews[zone.id].mimeType}
                fit={zonePreviews[zone.id].mediaFit}
                alt={`${zone.name} content`}
                className="pointer-events-none absolute inset-0 h-full w-full rounded-none"
              />
            )}
            <span className={`absolute left-2 top-2 rounded px-2 py-1 text-[10px] font-bold text-primary-foreground ${selectedIndex === index ? "bg-primary" : "bg-overlay"}`}>
              {fillAvailable ? `${String.fromCharCode(65 + index)} ${zone.name}` : `${zone.name} · ${resolution
                ? `${referencePixels(zone.width, resolution[0])}×${referencePixels(zone.height, resolution[1])}px`
                : `${zone.width.toFixed(3)}×${zone.height.toFixed(3)}%`}`}
            </span>
            {selectedIndex === index && !(zone.id && lockedZoneIds.has(zone.id)) &&
              RESIZE_HANDLES.map((h) => (
                <div
                  key={h.handle}
                  onPointerDown={startDrag(index, h.handle)}
                  className={`absolute h-3 w-3 rounded-full border border-t1-white bg-primary ${h.className}`}
                />
              ))}
          </div>
        ))}
        {guides.x !== null && (
          <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-error" style={{ left: `min(${guides.x}%, calc(100% - 1px))` }} />
        )}
        {guides.y !== null && (
          <div className="pointer-events-none absolute inset-x-0 z-20 h-px bg-error" style={{ top: `min(${guides.y}%, calc(100% - 1px))` }} />
        )}
      </div>
      </div>

      {fillAvailable && (
        <div className="flex shrink-0 items-center justify-center gap-1.5">
          <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 0.25} onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))} className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-40"><MinusIcon /></button>
          <span className="min-w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)} %</span>
          <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 2} onClick={() => setZoom((value) => Math.min(2, value + 0.25))} className="rounded-md border border-border p-1 text-muted-foreground disabled:opacity-40"><PlusIcon /></button>
          <button type="button" aria-label="Fit to Screen" title="Fit to Screen" onClick={() => setZoom(1)} className="rounded-md border border-border p-1 text-muted-foreground"><ExpandIcon /></button>
          <button type="button" onClick={() => setShowGrid((value) => !value)} aria-pressed={showGrid} className={`ml-2 rounded-md border px-2 py-1 text-[10px] font-medium ${showGrid ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>Show grid</button>
          <button type="button" onClick={() => setSnap((value) => !value)} aria-pressed={snap} className={`rounded-md border px-2 py-1 text-[10px] font-medium ${snap ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground"}`}>Snap to grid</button>
        </div>
      )}

      {overlapping.size > 0 && (
        <p className="text-sm text-error">
          Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่
        </p>
      )}
    </div>
  );
}
