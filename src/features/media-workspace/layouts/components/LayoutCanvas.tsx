"use client";

// The drag-resize surface. Coordinates never leave percent — the container's CSS
// aspect-ratio makes it the same shape the display will be, so a pointer delta divided
// by the container's own measured box is already the right unit, with no px/frame
// conversion layer to get wrong (docs/layouts/plan-layout-execution.md Task 7 Step 2).

import { useEffect, useRef, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { parseAspectRatio, parseResolution, referencePixels, roundPercent, validateZones } from "../geometry";
import type { LayoutZone } from "../types";

// Zone fill cycles by position — role is gone (ADR 0049 §2), so colour is purely for telling
// adjacent Zones apart, not for meaning.
const ZONE_FILL = [
  "bg-violet-500/60 border-violet-600",
  "bg-sky-500/60 border-sky-600",
  "bg-amber-500/60 border-amber-600",
  "bg-zinc-400/60 border-zinc-500",
];

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

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

function computeNextRect(
  start: LayoutZone,
  handle: Handle,
  dxPct: number,
  dyPct: number,
  round: (v: number) => number
): Pick<LayoutZone, "x" | "y" | "width" | "height"> {
  let { x, y, width, height } = start;
  if (handle === "move") {
    x += dxPct;
    y += dyPct;
  } else {
    if (handle.includes("e")) width += dxPct;
    if (handle.includes("w")) {
      x += dxPct;
      width -= dxPct;
    }
    if (handle.includes("s")) height += dyPct;
    if (handle.includes("n")) {
      y += dyPct;
      height -= dyPct;
    }
  }
  width = Math.max(1, Math.min(100, width));
  height = Math.max(1, Math.min(100, height));
  x = Math.max(0, Math.min(100 - width, x));
  y = Math.max(0, Math.min(100 - height, y));
  return { x: round(x), y: round(y), width: round(width), height: round(height) };
}

export function LayoutCanvas({
  zones,
  background,
  aspectRatio,
  referenceResolution = null,
  zonePreviews = {},
  selectedIndex,
  onSelectIndex,
  onChangeStart,
  onChange,
}: {
  zones: LayoutZone[];
  background: string;
  aspectRatio: string;
  referenceResolution?: string | null;
  zonePreviews?: Record<string, { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string }>;
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  onChangeStart?: () => boolean;
  onChange: (zones: LayoutZone[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState(false);
  // 70vh is a page-layout guess that's wrong once real content (page header, template
  // rail, other cards) sits above the canvas — measure the actual remaining viewport height
  // from where the canvas starts, so a portrait resolution never needs a page scroll to see
  // the whole frame (Ticket 19 item 4, found wrong in browser verification).
  const [maxHeightPx, setMaxHeightPx] = useState<number | null>(null);
  useEffect(() => {
    const recompute = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      setMaxHeightPx(Math.max(200, window.innerHeight - top - 24));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);
  const drag = useRef<{
    index: number;
    handle: Handle;
    startClientX: number;
    startClientY: number;
    startZone: LayoutZone;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  const [ratioW, ratioH] = parseAspectRatio(aspectRatio) ?? [16, 9];
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  const errors = validateZones(zones);
  const overlapping = new Set(
    errors.flatMap((e) => (e.kind === "overlap" ? [e.a, e.b] : []))
  );

  const startDrag = (index: number, handle: Handle) => (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelectIndex(index);
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
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleMove = (e: PointerEvent) => {
    const state = drag.current;
    if (!state) return;
    const dxPct = ((e.clientX - state.startClientX) / state.containerWidth) * 100;
    const dyPct = ((e.clientY - state.startClientY) / state.containerHeight) * 100;
    const round = snap ? Math.round : roundPercent;
    const nextRect = computeNextRect(state.startZone, state.handle, dxPct, dyPct, round);
    onChange(zones.map((z, i) => (i === state.index ? { ...z, ...nextRect } : z)));
  };

  const handleUp = () => {
    drag.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Canvas</p>
        <button
          type="button"
          onClick={() => setSnap((v) => !v)}
          aria-pressed={snap}
          className={`rounded-lg border px-3 py-1 text-xs font-medium ${
            snap
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              : "border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          }`}
        >
          Snap to grid
        </button>
      </div>

      <div
        ref={containerRef}
        onClick={() => onSelectIndex(null)}
        className="relative mx-auto w-full select-none overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
        style={{
          aspectRatio: `${ratioW} / ${ratioH}`,
          // Bounded on both axes: capped at 42rem wide (the old max-w-2xl) OR whatever
          // width keeps the height under the measured remaining viewport space, whichever
          // is smaller — a portrait ratio like 1080x1920 no longer scrolls the page.
          maxWidth: `min(42rem, calc(${maxHeightPx ?? 500}px * ${ratioW} / ${ratioH}))`,
          backgroundColor: background,
          backgroundImage: snap
            ? "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)"
            : undefined,
          backgroundSize: snap ? "10% 10%" : undefined,
        }}
      >
        {zones.map((zone, index) => (
          <div
            key={zone.id ?? index}
            onPointerDown={startDrag(index, "move")}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIndex(index);
            }}
            className={`absolute cursor-move border-2 ${ZONE_FILL[index % ZONE_FILL.length]} ${
              overlapping.has(index) ? "outline outline-2 outline-red-500" : ""
            } ${selectedIndex === index ? "ring-2 ring-offset-1 ring-indigo-500" : ""}`}
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
                alt={`${zone.name} content`}
                className="pointer-events-none absolute inset-0 h-full w-full rounded-none"
              />
            )}
            <span className="absolute left-1 top-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
              {zone.name} · {zone.width.toFixed(3)}×{zone.height.toFixed(3)}%
              {resolution &&
                ` — ${referencePixels(zone.width, resolution[0])}×${referencePixels(zone.height, resolution[1])}px`}
            </span>
            {selectedIndex === index &&
              RESIZE_HANDLES.map((h) => (
                <div
                  key={h.handle}
                  onPointerDown={startDrag(index, h.handle)}
                  className={`absolute h-3 w-3 rounded-full border border-white bg-indigo-600 ${h.className}`}
                />
              ))}
          </div>
        ))}
      </div>

      {overlapping.size > 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่
        </p>
      )}
    </div>
  );
}
