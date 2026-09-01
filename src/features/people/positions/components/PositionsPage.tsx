"use client";

import { useMemo, useState } from "react";
import { positionRows, type PositionTab } from "../mock-data";
import { PositionDetailPanel } from "./PositionDetailPanel";
import { PositionFilterBar } from "./PositionFilterBar";
import { PositionStatTilesRow } from "./PositionStatTilesRow";
import { PositionTable } from "./PositionTable";
import { PositionTabs } from "./PositionTabs";
import { PositionsHeader } from "./PositionsHeader";

// HR Manager — the new "ตำแหน่งงาน" (Positions) page (`/people/positions`),
// built 2026-09-01. Fully mock (see mock-data.ts's header comment) — same
// master/detail shape as people/org-structure's OrgStructurePage.
export function PositionsPage() {
  const [activeTab, setActiveTab] = useState<PositionTab["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(positionRows[0]?.id ?? null);

  const rows = useMemo(
    () => (activeTab === "all" ? positionRows : positionRows.filter((row) => row.status === activeTab)),
    [activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <PositionsHeader />
      <PositionStatTilesRow />
      <PositionTabs active={activeTab} onChange={setActiveTab} />
      <PositionFilterBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PositionTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2">
          <PositionDetailPanel rows={positionRows} selectedId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    </div>
  );
}
