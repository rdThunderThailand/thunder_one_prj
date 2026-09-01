"use client";

import { useState } from "react";
import type { OrgUnitNode, OrgViewTabId } from "../mock-data";
import { OrgChartCanvas } from "./OrgChartCanvas";
import { OrgDetailPanel } from "./OrgDetailPanel";
import { OrgStatTilesRow } from "./OrgStatTilesRow";
import { OrgStructureHeader } from "./OrgStructureHeader";

interface OrgStructurePageProps {
  /** `null` when the Core fetch failed or no tenant/session was resolved —
   *  see this feature's app route (people/org-structure/page.tsx). No silent
   *  fallback to mock data: same "explicit error state, not fake content"
   *  discipline as asset-intelligence/assets's AllAssetsPage. */
  units: Record<string, OrgUnitNode> | null;
  rootUnitId: string | null;
}

// HR Manager — org chart + master/detail panel (`/people/org-structure`).
export function OrgStructurePage({ units, rootUnitId }: OrgStructurePageProps) {
  const [activeView, setActiveView] = useState<OrgViewTabId>("chart");
  const [selectedId, setSelectedId] = useState<string | null>(rootUnitId);

  return (
    <div className="flex flex-col gap-6">
      <OrgStructureHeader activeView={activeView} onChangeView={setActiveView} />
      <OrgStatTilesRow />

      {activeView !== "chart" ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : !units || !rootUnitId ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ไม่สามารถโหลดโครงสร้างองค์กรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <OrgChartCanvas units={units} rootUnitId={rootUnitId} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-2">
            <OrgDetailPanel
              units={units}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
