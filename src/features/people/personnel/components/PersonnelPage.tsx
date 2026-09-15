"use client";

import { useState } from "react";
import type { OrgUnitNode } from "@/features/people/org-structure";
import type { PersonnelRow, PersonnelViewTab } from "../mock-data";
import { EditPersonnelModal } from "./EditPersonnelModal";
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
  /** For EditPersonnelModal's department dropdown + the `updateMember()`
   *  call it fires on save. `null` disables the row-action edit button
   *  (same "no tenant/session resolved" case as `rows: null` above). */
  tenantId: string | null;
  units: Record<string, OrgUnitNode>;
}

// HR Manager — the full personnel roster (`/people/personnel`), reading real
// data from Core's GET /tenants/:id/members (mapped in ../core-mapper.ts).
// 2026-09-01: redesigned tabs from a type filter into 5 view tabs — only
// "roster" (the default) shows the real table below; the other 4 render a
// placeholder, same convention people/org-structure's OrgStructurePage uses
// for its own unbuilt view tabs (see mock-data.ts's header comment).
// "เพิ่มบุคลากร" (PersonnelHeader) links to people/add-person's type-picker
// page (/people/add) instead of opening an in-page modal — see that
// feature's own README for what's real vs. cosmetic in the flows it leads
// to.
export function PersonnelPage({ rows: fetchedRows, totalCount, tenantId, units }: PersonnelPageProps) {
  const [activeTab, setActiveTab] = useState<PersonnelViewTab>("roster");
  const [editingRow, setEditingRow] = useState<PersonnelRow | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PersonnelHeader />
      <PersonnelStatTilesRow totalCount={totalCount} />
      <PersonnelTabs active={activeTab} onChange={setActiveTab} />

      {activeTab !== "roster" ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <>
          <PersonnelFilterBar />
          {fetchedRows === null ? (
            <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
              ไม่สามารถโหลดรายชื่อบุคลากรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
          ) : (
            <>
              <PersonnelTableControls shownCount={fetchedRows.length} totalCount={totalCount} />
              <PersonnelTable rows={fetchedRows} onEditRow={setEditingRow} />
            </>
          )}
        </>
      )}

      {editingRow && tenantId && (
        <EditPersonnelModal
          row={editingRow}
          tenantId={tenantId}
          units={units}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}
