import { UsersIcon } from "@/components/ui/icons";
import type { OrgUnitNode } from "../mock-data";

interface OrgChartNodeProps {
  unitId: string;
  units: Record<string, OrgUnitNode>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Recursive — one call per level of the tree. The horizontal "bus" line above
// a row of siblings is a plain border-top on their flex container; each
// sibling drops its own short vertical line up to that bus from an
// absolutely-positioned span centered on itself. Pure CSS, no SVG/canvas —
// good enough for a fixed, non-draggable tree this size. `units` is passed
// down rather than imported from mock-data directly, so this same component
// renders either the mock tree or the real one mapped from Core (see
// OrgStructurePage's own comment).
export function OrgChartNode({ unitId, units, selectedId, onSelect }: OrgChartNodeProps) {
  const unit = units[unitId];
  const hasChildren = unit.childIds.length > 0;
  const selected = unitId === selectedId;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onSelect(unitId)}
        className={`flex min-w-[168px] items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
          selected
            ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-500/10"
            : "border-zinc-200 bg-white hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-800"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <UsersIcon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{unit.name}</span>
          {unit.headTitle && (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{unit.headTitle}</span>
          )}
          <span className="block text-xs text-zinc-400">{unit.employeeCount}</span>
        </span>
      </button>

      {hasChildren && (
        <>
          <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700" />
          <div className="flex gap-8 border-t border-zinc-300 pt-6 dark:border-zinc-700">
            {unit.childIds.map((childId) => (
              <div key={childId} className="relative flex flex-col items-center px-1">
                <div className="absolute -top-6 left-1/2 h-6 w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700" />
                <OrgChartNode unitId={childId} units={units} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
