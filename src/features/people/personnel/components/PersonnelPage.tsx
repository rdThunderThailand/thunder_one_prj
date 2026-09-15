"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { OrgUnitNode } from "@/features/people/org-structure";
import { isOnProbation } from "../core-mapper";
import type { PersonnelRow, PersonnelType, PersonnelViewTab, WorkStatus } from "../mock-data";
import { EditPersonnelModal } from "./EditPersonnelModal";
import { PersonnelFilterBar } from "./PersonnelFilterBar";
import { PersonnelGridView } from "./PersonnelGridView";
import { PersonnelGroupedView } from "./PersonnelGroupedView";
import { PersonnelHeader } from "./PersonnelHeader";
import { PersonnelStatTilesRow } from "./PersonnelStatTilesRow";
import { PersonnelTable } from "./PersonnelTable";
import { PersonnelTableControls } from "./PersonnelTableControls";
import { PersonnelTabs } from "./PersonnelTabs";
import { ViewPersonnelModal } from "./ViewPersonnelModal";

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

const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  active: "ทำงานอยู่",
  "on-leave": "ลาหยุด",
  invited: "เชิญแล้ว",
  inactive: "พ้นสภาพ",
};

// HR Manager — the full personnel roster (`/people/personnel`), reading real
// data from Core's GET /tenants/:id/members (mapped in ../core-mapper.ts).
// **Redesigned 2026-09-15** to match the coordinating session's mockup:
// real stat tiles (3 of 5 — see PersonnelStatTilesRow), real content for 4
// of the 5 view tabs (grouped summaries for by-unit/by-position/
// by-employment-status, a filtered roster for probation), real filters,
// a real list/grid toggle, real client-side pagination, and view/edit
// actions per row. "เพิ่มบุคลากร" (PersonnelHeader) links to
// people/add-person's type-picker page (/people/add) instead of opening an
// in-page modal — see that feature's own README for what's real vs.
// cosmetic in the flows it leads to.
export function PersonnelPage({ rows: fetchedRows, totalCount, tenantId, units }: PersonnelPageProps) {
  const [activeTab, setActiveTab] = useState<PersonnelViewTab>("roster");
  const [editingRow, setEditingRow] = useState<PersonnelRow | null>(null);
  const [viewingRow, setViewingRow] = useState<PersonnelRow | null>(null);
  const [unitFilter, setUnitFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<PersonnelType | "">("");
  const [workStatusFilter, setWorkStatusFilter] = useState<WorkStatus | "">("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Lazy useState initializer, not a bare `new Date()` call in the render
  // body (react-hooks/purity) — same pattern NewHireSidebar already uses.
  // Computed once at mount; "this month" not changing mid-session is an
  // acceptable trade-off for a dashboard tile.
  const [currentMonthKey] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
  });

  // Real since 2026-09-15 — ?department=<unitId>, followed from
  // org-structure's "ดูบุคลากรในหน่วยงานนี้" action. Exact department match
  // (not sub-departments), kept separate from the หน่วยงาน dropdown below
  // (which filters by label) since they're two different entry points into
  // the same roster and can combine without conflicting.
  const searchParams = useSearchParams();
  const departmentIdFilter = searchParams.get("department");
  const departmentName = departmentIdFilter ? (units[departmentIdFilter]?.name ?? departmentIdFilter) : null;

  const allRows = useMemo(() => fetchedRows ?? [], [fetchedRows]);

  const unitOptions = useMemo(
    () => Array.from(new Set(allRows.map((r) => r.unit).filter((u) => u !== "-"))).sort((a, b) => a.localeCompare(b)),
    [allRows]
  );
  const positionOptions = useMemo(
    () =>
      Array.from(new Set(allRows.map((r) => r.position).filter((p) => p !== "-"))).sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (departmentIdFilter && row.departmentId !== departmentIdFilter) return false;
      if (unitFilter && row.unit !== unitFilter) return false;
      if (positionFilter && row.position !== positionFilter) return false;
      if (typeFilter && row.type !== typeFilter) return false;
      if (workStatusFilter && row.workStatus !== workStatusFilter) return false;
      return true;
    });
  }, [allRows, departmentIdFilter, unitFilter, positionFilter, typeFilter, workStatusFilter]);

  const visibleRows = useMemo(
    () => (activeTab === "probation" ? filteredRows.filter((r) => isOnProbation(r.probationEndDate)) : filteredRows),
    [activeTab, filteredRows]
  );

  // Reset to page 1 whenever the tab or any filter changes, so page 3 of an
  // old filter doesn't silently show page 3 of a much smaller new one.
  // Adjusting state during render (React's own sanctioned pattern for "a
  // prop/dependency changed, reset derived state") rather than a
  // useEffect + setState, which the react-hooks/set-state-in-effect rule
  // flags as an unnecessary extra render.
  const filterKey = `${activeTab}:${departmentIdFilter}:${unitFilter}:${positionFilter}:${typeFilter}:${workStatusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pagedRows = useMemo(
    () => visibleRows.slice((page - 1) * pageSize, page * pageSize),
    [visibleRows, page, pageSize]
  );

  const contractorCount = allRows.filter((r) => r.type === "contractor").length;
  const newHiresThisMonth = allRows.filter((r) => {
    if (!r.startDate) return false;
    const start = new Date(r.startDate);
    return !Number.isNaN(start.getTime()) && `${start.getUTCFullYear()}-${start.getUTCMonth()}` === currentMonthKey;
  }).length;

  function handleReset() {
    setUnitFilter("");
    setPositionFilter("");
    setTypeFilter("");
    setWorkStatusFilter("");
  }

  return (
    <div className="flex flex-col gap-6">
      <PersonnelHeader rows={fetchedRows} />
      <PersonnelStatTilesRow
        totalCount={totalCount}
        contractorCount={contractorCount}
        newHiresThisMonth={newHiresThisMonth}
      />
      <PersonnelTabs active={activeTab} onChange={setActiveTab} />

      {fetchedRows === null ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ไม่สามารถโหลดรายชื่อบุคลากรได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </p>
      ) : activeTab === "by-unit" ? (
        <PersonnelGroupedView
          rows={filteredRows}
          groupBy={(row) => row.unit}
          onSelectGroup={(unit) => {
            setUnitFilter(unit);
            setActiveTab("roster");
          }}
        />
      ) : activeTab === "by-position" ? (
        <PersonnelGroupedView
          rows={filteredRows}
          groupBy={(row) => row.position}
          onSelectGroup={(position) => {
            setPositionFilter(position);
            setActiveTab("roster");
          }}
        />
      ) : activeTab === "by-employment-status" ? (
        <PersonnelGroupedView
          rows={filteredRows}
          groupBy={(row) => row.workStatus}
          labelFor={(key) => WORK_STATUS_LABEL[key as WorkStatus] ?? key}
          onSelectGroup={(status) => {
            setWorkStatusFilter(status as WorkStatus);
            setActiveTab("roster");
          }}
        />
      ) : (
        <>
          <PersonnelFilterBar
            unit={unitFilter}
            onUnitChange={setUnitFilter}
            unitOptions={unitOptions}
            position={positionFilter}
            onPositionChange={setPositionFilter}
            positionOptions={positionOptions}
            type={typeFilter}
            onTypeChange={setTypeFilter}
            workStatus={workStatusFilter}
            onWorkStatusChange={setWorkStatusFilter}
            view={view}
            onViewChange={setView}
            onReset={handleReset}
          />
          {departmentName && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              กรองตามหน่วยงาน: <span className="font-medium text-zinc-900 dark:text-zinc-50">{departmentName}</span>{" "}
              <Link href="/people/personnel" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                ล้างตัวกรอง
              </Link>
            </p>
          )}
          {view === "list" ? (
            <PersonnelTable
              rows={pagedRows}
              startIndex={(page - 1) * pageSize}
              onEditRow={setEditingRow}
              onViewRow={setViewingRow}
            />
          ) : (
            <PersonnelGridView rows={pagedRows} onEditRow={setEditingRow} onViewRow={setViewingRow} />
          )}
          <PersonnelTableControls
            shownCount={pagedRows.length}
            filteredCount={visibleRows.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}

      {editingRow && tenantId && (
        <EditPersonnelModal row={editingRow} tenantId={tenantId} units={units} onClose={() => setEditingRow(null)} />
      )}
      {viewingRow && (
        <ViewPersonnelModal
          row={viewingRow}
          onClose={() => setViewingRow(null)}
          onEdit={() => {
            setEditingRow(viewingRow);
            setViewingRow(null);
          }}
        />
      )}
    </div>
  );
}
