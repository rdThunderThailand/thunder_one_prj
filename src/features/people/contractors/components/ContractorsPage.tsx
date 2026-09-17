"use client";

import { useMemo, useState } from "react";
import { LoadFailure } from "@/features/people/shared";
import type { ContractorRow, ContractorTab } from "../mock-data";
import { ContractorFilterPanel } from "./ContractorFilterPanel";
import { ContractorStatTilesRow } from "./ContractorStatTilesRow";
import { ContractorTable } from "./ContractorTable";
import { ContractorTabs } from "./ContractorTabs";
import { ContractorsHeader } from "./ContractorsHeader";

interface ContractorsPageProps {
  /** Real since 2026-09-15 (`GET /tenants/:id/members`, filtered to
   *  `member_type === "contractor"` — see `../core-mapper.ts`). `null` when
   *  the Core fetch failed or no tenant/session was resolved — same
   *  "explicit error state, not fake content" discipline as
   *  org-structure/personnel/new-hires. `ContractorStatTilesRow`'s tiles and
   *  `ContractorFilterPanel`'s dropdowns are still mock/decorative, not in
   *  this round's scope. */
  rows: ContractorRow[] | null;
}

// HR Manager — the standalone Contractor roster page
// (`/people/contractors`), built 2026-09-01, wired to real data 2026-09-15
// — table + tabs + stat-tiles shape borrowed from people/personnel, but
// with a right-side filter panel instead of a per-row detail view, matching
// the mockup's own layout.
export function ContractorsPage({ rows: fetchedRows }: ContractorsPageProps) {
  const [activeTab, setActiveTab] = useState<ContractorTab["id"]>("all");
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const allRows = useMemo(() => fetchedRows ?? [], [fetchedRows]);

  const unitOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.unit).filter((u) => u !== "-"))).sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (activeTab !== "all" && row.status !== activeTab) return false;
      if (unitFilter && row.unit !== unitFilter) return false;
      if (q && !`${row.name} ${row.role}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, activeTab, unitFilter, search]);

  function handleClear() {
    setSearch("");
    setUnitFilter("");
    setActiveTab("all");
  }

  return (
    <div className="flex flex-col gap-6">
      <ContractorsHeader />
      <ContractorStatTilesRow rows={allRows} />
      <ContractorTabs active={activeTab} onChange={setActiveTab} rows={allRows} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {fetchedRows === null ? (
            <LoadFailure message="ไม่สามารถโหลดข้อมูลผู้ปฏิบัติงานภายนอกได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" />
          ) : (
            <ContractorTable rows={rows} />
          )}
        </div>
        <div className="lg:col-span-1">
          <ContractorFilterPanel
            search={search}
            onSearchChange={setSearch}
            unit={unitFilter}
            onUnitChange={setUnitFilter}
            unitOptions={unitOptions}
            onClear={handleClear}
          />
        </div>
      </div>
    </div>
  );
}
