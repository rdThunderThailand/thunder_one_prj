"use client";

import { useMemo, useState } from "react";
import { changeRows, type ChangeStatus, type ChangeTab, type ResolvedChangeRow } from "../mock-data";
import { ChangeDetailPanel } from "./ChangeDetailPanel";
import { ChangeTable } from "./ChangeTable";
import { ChangeTableControls } from "./ChangeTableControls";
import { ChangesFilterBar } from "./ChangesFilterBar";
import { ChangesHeader } from "./ChangesHeader";
import { ChangesStatTilesRow } from "./ChangesStatTilesRow";
import { ChangesTabs } from "./ChangesTabs";

// HR Manager — change requests roster + approve/reject detail panel
// (`/people/changes`). Approve/Reject is real, client-local state — one
// override per change id, kept here (not in mock-data.ts) so it resets on
// reload, same discipline as asset-intelligence/departments's RequestsPage.
// Defaults to "c-1" (ณิชา รัตนกุล) selected, matching the reference
// mockup's initial screenshot.
export function ChangesPage() {
  const [activeTab, setActiveTab] = useState<ChangeTab["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>("c-1");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ChangeStatus>>({});

  const resolvedRows: ResolvedChangeRow[] = useMemo(
    () => changeRows.map((row) => ({ ...row, resolvedStatus: statusOverrides[row.id] ?? row.status })),
    [statusOverrides]
  );

  const visibleRows = useMemo(
    () => (activeTab === "all" ? resolvedRows : resolvedRows.filter((row) => row.resolvedStatus === activeTab)),
    [resolvedRows, activeTab]
  );

  const selectedChange = resolvedRows.find((row) => row.id === selectedId) ?? null;

  function setOverride(id: string, status: ChangeStatus) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
  }

  return (
    <div className="flex flex-col gap-6">
      <ChangesHeader />
      <ChangesStatTilesRow />
      <ChangesTabs active={activeTab} onChange={setActiveTab} />
      <ChangesFilterBar />
      <ChangeTableControls />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChangeTable rows={visibleRows} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2">
          <ChangeDetailPanel
            change={selectedChange}
            onApprove={(id) => setOverride(id, "completed")}
            onReject={(id) => setOverride(id, "cancelled")}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  );
}
