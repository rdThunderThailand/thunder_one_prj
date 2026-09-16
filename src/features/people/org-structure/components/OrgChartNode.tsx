import { useState } from "react";
import { BuildingIcon, ChevronDownIcon, MoreIcon, UsersIcon } from "@/components/ui/icons";
import type { OrgUnitNode } from "../mock-data";
import { unitTypeColorClasses } from "../unit-colors";

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
//
// Collapse/expand is real since 2026-09-15 — each node owns its own
// collapsed `useState`, not lifted to a shared Set: collapsing is a pure
// per-node UI concern (doesn't affect which unit is selected/how any other
// node renders), so there's no reason for a sibling's collapse to cause this
// node (or the canvas) to re-render.
export function OrgChartNode({ unitId, units, selectedId, onSelect }: OrgChartNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const unit = units[unitId];
  const hasChildren = unit.childIds.length > 0;
  const selected = unitId === selectedId;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`flex min-w-[188px] items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
            selected
              ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-500/10"
              : "border-zinc-200 bg-white hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-800"
          }`}
        >
          <button type="button" onClick={() => onSelect(unitId)} className="flex min-w-0 flex-1 items-start gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${unitTypeColorClasses(unit.unitType)}`}
            >
              <UsersIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {unit.name}
              </span>
              {unit.headTitle && (
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{unit.headTitle}</span>
              )}
              <span className="mt-1 flex items-center gap-2.5 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" />
                  {unit.employeeCount} คน
                </span>
                {unit.teamsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <BuildingIcon className="h-3 w-3" />
                    {unit.teamsCount} หน่วยงาน
                  </span>
                )}
              </span>
            </span>
          </button>
          <button
            type="button"
            title="ยังไม่เปิดใช้งาน"
            className="shrink-0 cursor-not-allowed text-zinc-300 hover:text-zinc-400 dark:text-zinc-600"
          >
            <MoreIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            title={collapsed ? `ขยาย (${unit.childIds.length} หน่วยงานย่อย)` : "พับหน่วยงานย่อย"}
            className="absolute -bottom-2.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <ChevronDownIcon className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          </button>
        )}
      </div>

      {hasChildren && !collapsed && (
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
      {hasChildren && collapsed && (
        <p className="mt-3 text-xs text-zinc-400">
          + {unit.childIds.length} หน่วยงานย่อย ({sumDescendantEmployeeCount(unit, units)} คน)
        </p>
      )}
    </div>
  );
}

function sumDescendantEmployeeCount(unit: OrgUnitNode, units: Record<string, OrgUnitNode>): number {
  return unit.childIds.reduce((sum, childId) => {
    const child = units[childId];
    return child ? sum + child.employeeCount : sum;
  }, 0);
}
