"use client";

import { useMemo, useState } from "react";
import { contractorRows, type ContractorTab } from "../mock-data";
import { ContractorFilterPanel } from "./ContractorFilterPanel";
import { ContractorStatTilesRow } from "./ContractorStatTilesRow";
import { ContractorTable } from "./ContractorTable";
import { ContractorTabs } from "./ContractorTabs";
import { ContractorsHeader } from "./ContractorsHeader";

// HR Manager — the new standalone Contractor roster page
// (`/people/contractors`), built 2026-09-01. Fully mock (see mock-data.ts's
// header comment) — table + tabs + stat-tiles shape borrowed from
// people/personnel, but with a right-side filter panel instead of a
// per-row detail view, matching the mockup's own layout.
export function ContractorsPage() {
  const [activeTab, setActiveTab] = useState<ContractorTab["id"]>("all");

  const rows = useMemo(
    () => (activeTab === "all" ? contractorRows : contractorRows.filter((row) => row.status === activeTab)),
    [activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <ContractorsHeader />
      <ContractorStatTilesRow />
      <ContractorTabs active={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ContractorTable rows={rows} />
        </div>
        <div className="lg:col-span-1">
          <ContractorFilterPanel />
        </div>
      </div>
    </div>
  );
}
