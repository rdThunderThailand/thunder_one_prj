"use client";

import { useMemo, useState } from "react";
import type { CoreRole } from "@/features/people/personnel";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { newHireRows, type NewHireRow, type NewHireTab } from "../mock-data";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { NewHireDetailPanel } from "./NewHireDetailPanel";
import { NewHireTable } from "./NewHireTable";
import { NewHireTableControls } from "./NewHireTableControls";
import { NewHiresFilterBar } from "./NewHiresFilterBar";
import { NewHiresHeader } from "./NewHiresHeader";
import { NewHiresStatTilesRow } from "./NewHiresStatTilesRow";
import { NewHiresTabs } from "./NewHiresTabs";

interface NewHiresPageProps {
  /** Passed straight through to AddEmployeeModal — see its own props for
   *  what each one unblocks/degrades when unavailable. */
  tenantId: string | null;
  roles: CoreRole[] | null;
  units: Record<string, OrgUnitNode> | null;
}

// HR Manager — new hires roster + onboarding detail panel (`/people/new-hires`).
// Defaults to "p-1" (แอน สุภาภรณ์) selected, matching the reference mockup's
// initial screenshot. `addedRows` is real, client-local state (prepended
// ahead of the mock data, never persisted) — a hire added via
// AddEmployeeModal actually shows up in the table and can be selected into
// the detail panel, same discipline as people/personnel's AddPersonModal.
// The roster itself (newHireRows) is still mock — only the *creation* flow
// (AddEmployeeModal) calls real Core endpoints now; see its own comment.
export function NewHiresPage({ tenantId, roles, units }: NewHiresPageProps) {
  const [activeTab, setActiveTab] = useState<NewHireTab["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>("p-1");
  const [addedRows, setAddedRows] = useState<NewHireRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const allRows = useMemo(() => [...addedRows, ...newHireRows], [addedRows]);

  const rows = useMemo(
    () => (activeTab === "all" ? allRows : allRows.filter((row) => row.status === activeTab)),
    [allRows, activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      <NewHiresHeader onAddEmployee={() => setShowAddModal(true)} />
      <NewHiresStatTilesRow />
      <NewHiresTabs active={activeTab} onChange={setActiveTab} />
      <NewHiresFilterBar />
      <NewHireTableControls />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <NewHireTable rows={rows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2">
          <NewHireDetailPanel rows={allRows} selectedId={selectedId} onClose={() => setSelectedId(null)} />
        </div>
      </div>

      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(row) => {
          setAddedRows((prev) => [row, ...prev]);
          setSelectedId(row.id);
        }}
        tenantId={tenantId}
        roles={roles}
        units={units}
      />
    </div>
  );
}
