"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
  // Real since 2026-09-15 — ?department=<unitId>, followed from
  // org-structure's "ดูบุคลากรในหน่วยงานนี้" action. Client-side against the
  // already-fetched roster, same reasoning as new-hires/contractors'
  // filters: the whole page's rows are already in memory.
  const searchParams = useSearchParams();
  const departmentFilter = searchParams.get("department");
  const departmentName = departmentFilter ? (units[departmentFilter]?.name ?? departmentFilter) : null;

  const displayedRows = useMemo(() => {
    if (!fetchedRows || !departmentFilter) return fetchedRows;
    return fetchedRows.filter((row) => row.departmentId === departmentFilter);
  }, [fetchedRows, departmentFilter]);

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
          {departmentName && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              กรองตามหน่วยงาน: <span className="font-medium text-zinc-900 dark:text-zinc-50">{departmentName}</span>{" "}
              <Link href="/people/personnel" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                ล้างตัวกรอง
              </Link>
            </p>
          )}
          {displayedRows === null ? (
            <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
              ไม่สามารถโหลดรายชื่อบุคลากรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
          ) : (
            <>
              <PersonnelTableControls shownCount={displayedRows.length} totalCount={totalCount} />
              <PersonnelTable rows={displayedRows} onEditRow={setEditingRow} />
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
