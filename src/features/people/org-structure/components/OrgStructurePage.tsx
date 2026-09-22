"use client";

import { useState } from "react";
import { LoadFailure } from "@/features/people/shared";
import type { OrgUnitNode, OrgViewTabId } from "../mock-data";
import { OrgChartCanvas } from "./OrgChartCanvas";
import { OrgDetailPanel } from "./OrgDetailPanel";
import { OrgStatTilesRow } from "./OrgStatTilesRow";
import { OrgStructureHeader } from "./OrgStructureHeader";
import { OrgUnitListView } from "./OrgUnitListView";

interface OrgStructurePageProps {
  /** `null` only when the Core fetch itself failed (network/HTTP/shape
   *  error) or no tenant/session was resolved — see this feature's app
   *  route (people/org-structure/page.tsx). A tenant with zero departments
   *  configured yet is a *different*, non-null case: `units` comes back as
   *  `{}` and `rootUnitId` as `null`. These used to render the exact same
   *  generic error message, making "Core is down" indistinguishable from
   *  "this tenant just hasn't set up any departments" (fixed 2026-09-14). No
   *  silent fallback to mock data either way — same "explicit state, not
   *  fake content" discipline as asset-intelligence/assets's AllAssetsPage. */
  units: Record<string, OrgUnitNode> | null;
  rootUnitId: string | null;
}

// HR Manager — org chart + master/detail panel (`/people/org-structure`).
export function OrgStructurePage({ units, rootUnitId }: OrgStructurePageProps) {
  const [activeView, setActiveView] = useState<OrgViewTabId>("chart");
  const [selectedId, setSelectedId] = useState<string | null>(rootUnitId);

  const isEmpty = units !== null && (Object.keys(units).length === 0 || !rootUnitId);

  return (
    <div className="flex flex-col gap-6">
      <OrgStructureHeader activeView={activeView} onChangeView={setActiveView} units={units} rootUnitId={rootUnitId} />
      {units && <OrgStatTilesRow units={units} rootUnitId={rootUnitId ?? Object.keys(units)[0] ?? ""} />}

      {activeView === "list" ? (
        units ? (
          <OrgUnitListView units={units} onSelect={setSelectedId} />
        ) : (
          <LoadFailure message="ไม่สามารถโหลดโครงสร้างองค์กรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" />
        )
      ) : activeView !== "chart" ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : units === null ? (
        <LoadFailure message="ไม่สามารถโหลดโครงสร้างองค์กรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" />
      ) : isEmpty ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีการตั้งค่าหน่วยงานสำหรับองค์กรนี้ กรุณาตั้งค่าหน่วยงานก่อนเริ่มใช้งานผังองค์กร
        </p>
      ) : rootUnitId ? (
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
      ) : null}
    </div>
  );
}
