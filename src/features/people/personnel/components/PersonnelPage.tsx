"use client";

import { useMemo, useState } from "react";
import type { PersonnelRow, PersonnelTab } from "../mock-data";
import { AddPersonModal } from "./AddPersonModal";
import { PersonnelFilterBar } from "./PersonnelFilterBar";
import { PersonnelHeader } from "./PersonnelHeader";
import { PersonnelStatTilesRow } from "./PersonnelStatTilesRow";
import { PersonnelTable } from "./PersonnelTable";
import { PersonnelTableControls } from "./PersonnelTableControls";
import { PersonnelTabs } from "./PersonnelTabs";

interface PersonnelPageProps {
  /** `null` when the Core fetch failed or no tenant/session was resolved —
   *  see this feature's app route (people/personnel/page.tsx). No silent
   *  fallback to mock data: same "explicit error state, not fake content"
   *  discipline as asset-intelligence/assets's AllAssetsPage. */
  rows: PersonnelRow[] | null;
  totalCount: number;
}

// HR Manager — the full personnel roster (`/people/personnel`), now reading
// real data from Core's GET /tenants/:id/members (mapped in
// ../core-mapper.ts) instead of mock-data.ts's personnelRows. `addedRows` is
// still real, client-local state (prepended ahead of the fetched rows, never
// persisted) — a person added via AddPersonModal actually shows up in the
// table below, same "real button, local state only" discipline as
// asset-intelligence/departments's RequestsPage. AddPersonModal itself still
// writes locally rather than calling Core's real POST — see its own comment
// for why (Core's POST requires a `role_code` this app has no picker for
// yet).
export function PersonnelPage({ rows: fetchedRows, totalCount }: PersonnelPageProps) {
  const [activeTab, setActiveTab] = useState<PersonnelTab["id"]>("all");
  const [addedRows, setAddedRows] = useState<PersonnelRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const allRows = useMemo(() => [...addedRows, ...(fetchedRows ?? [])], [addedRows, fetchedRows]);

  const rows = useMemo(
    () => (activeTab === "all" ? allRows : allRows.filter((row) => row.type === activeTab)),
    [allRows, activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <PersonnelHeader onAddPerson={() => setShowAddModal(true)} />
      <PersonnelStatTilesRow />
      <PersonnelTabs active={activeTab} onChange={setActiveTab} />
      <PersonnelFilterBar />
      {fetchedRows === null ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ไม่สามารถโหลดรายชื่อบุคลากรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      ) : (
        <>
          <PersonnelTableControls shownCount={rows.length} totalCount={totalCount} />
          <PersonnelTable rows={rows} />
        </>
      )}
      <AddPersonModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(row) => setAddedRows((prev) => [row, ...prev])}
      />
    </div>
  );
}
