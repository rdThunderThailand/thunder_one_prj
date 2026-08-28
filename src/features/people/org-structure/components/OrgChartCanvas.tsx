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

// Zoom/fullscreen controls are decorative — the tree is a fixed, non-draggable
// CSS layout, not a real pan/zoom canvas. Same "Not built yet" convention as
// this page's other chrome.
export function OrgChartCanvas({ units, rootUnitId, selectedId, onSelect }: OrgChartCanvasProps) {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          <span
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-zinc-400"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </span>
          <span className="px-1 text-xs text-zinc-500 dark:text-zinc-400">100%</span>
          <span
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-zinc-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </span>
          <span
            title="Not built yet"
            className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md text-zinc-400"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max justify-center px-4">
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
