import { useState } from "react";
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
// still not a draggable/pannable canvas, just scale). "Fullscreen" stays
// decorative — a real fullscreen API call is a bigger, separate piece of
// work than this round's ask. Collapse/expand moved into OrgChartNode
// itself (per-node state, not this component's concern).
export function OrgChartCanvas({ units, rootUnitId, selectedId, onSelect }: OrgChartCanvasProps) {
  const [zoom, setZoom] = useState(100);

  return (
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
          <span
            title="ยังไม่เปิดใช้งาน"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-zinc-400"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </span>
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
  );
}
