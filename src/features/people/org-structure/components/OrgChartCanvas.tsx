import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ExpandIcon, MinusIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import type { OrgUnitNode } from "../mock-data";
import { OrgChartNode } from "./OrgChartNode";

interface OrgChartCanvasProps {
  units: Record<string, OrgUnitNode>;
  rootUnitId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 10;

// Zoom is real since 2026-09-15 (a CSS `transform: scale()` on the tree —
// still not a draggable/pannable canvas, just scale). Fullscreen is real
// too, same day — the browser Fullscreen API on this card's own element;
// no library, the API is small enough to call directly. Collapse/expand
// moved into OrgChartNode itself (per-node state, not this component's
// concern).
export function OrgChartCanvas({ units, rootUnitId, selectedId, onSelect }: OrgChartCanvasProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // `Card` isn't a forwardRef component, so the Fullscreen API's target is
  // this plain wrapper div around it instead — any element works as a
  // fullscreen target, this one just also happens to hold the card.
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Tracks the real fullscreen state (not just optimistic toggling) so the
  // button's icon/title stays correct even when the user exits via Esc
  // instead of clicking it again.
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  async function toggleFullscreen() {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await wrapperRef.current.requestFullscreen();
    }
  }

  return (
    <div ref={wrapperRef} className="[&:fullscreen]:overflow-auto [&:fullscreen]:bg-white [&:fullscreen]:p-4 [&:fullscreen]:dark:bg-zinc-900">
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            title="ย่อ"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="รีเซ็ตเป็น 100%"
            className="px-1 text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            title="ขยาย"
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => toggleFullscreen()}
            title={isFullscreen ? "ออกจากเต็มจอ" : "ขยายเต็มจอ"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="flex min-w-max origin-top justify-center px-4 transition-transform"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <OrgChartNode unitId={rootUnitId} units={units} selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-px w-5 bg-zinc-400" />
          สายการบังคับบัญชา
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-5 border-t border-dashed border-zinc-400" />
          สายงานประสานงาน
        </span>
        <span className="flex items-center gap-1.5">
          <UsersIcon className="h-3.5 w-3.5" />
          จำนวนพนักงาน
        </span>
      </div>
    </Card>
    </div>
  );
}
