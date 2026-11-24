"use client";

import { useMemo, useState } from "react";
import { departureRows, type DepartureTab } from "../mock-data";
import { DepartureDetailPanel } from "./DepartureDetailPanel";
import { DepartureTable } from "./DepartureTable";
import { DepartureTableControls } from "./DepartureTableControls";
import { DeparturesFilterBar } from "./DeparturesFilterBar";
import { DeparturesHeader } from "./DeparturesHeader";
import { DeparturesStatTilesRow } from "./DeparturesStatTilesRow";
import { DeparturesTabs } from "./DeparturesTabs";

// HR Manager — departures roster + offboarding detail panel
// (`/people/departures`). Defaults to "d-1" (สมชาย วงศ์ดี) selected,
// matching the reference mockup's initial screenshot.
export function DeparturesPage() {
  const [activeTab, setActiveTab] = useState<DepartureTab["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>("d-1");

  const rows = useMemo(
    () => (activeTab === "all" ? departureRows : departureRows.filter((row) => row.status === activeTab)),
    [activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <DeparturesHeader />
      <DeparturesStatTilesRow />
      <DeparturesTabs active={activeTab} onChange={setActiveTab} />
      <DeparturesFilterBar />
      <DepartureTableControls />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DepartureTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2">
          <DepartureDetailPanel selectedId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      </div>
    </div>
  );
}
