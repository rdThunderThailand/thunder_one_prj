"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
// Deep import (bypassing people/add-person's index.ts) so this file doesn't
// pull in AddEmployeeWizardPage — which itself imports this feature's
// mock-data.ts — and create a barrel-file import cycle between new-hires
// and add-person.
import { NEW_HIRE_HANDOFF_KEY } from "@/features/people/add-person/handoff";
import { ApiError } from "@/lib/api/api-error";
import { updateOnboardingStep } from "../services/onboarding-api";
import type { NewHireRow, NewHireStatus } from "../mock-data";
import { NewHireFunnelRow } from "./NewHireFunnelRow";
import { NewHireKanbanBoard } from "./NewHireKanbanBoard";
import { NewHireSidebar } from "./NewHireSidebar";
import { NewHiresFilterBar } from "./NewHiresFilterBar";
import { NewHiresHeader } from "./NewHiresHeader";

const STAGE_LABEL: Record<NewHireStatus, string> = {
  "pre-boarding": "Pre-boarding",
  onboarding: "Onboarding",
  "ready-to-work": "Ready to Work",
  active: "Active",
};

/**
 * A drag only ever lands on pre-boarding/onboarding/ready-to-work (see
 * NewHireKanbanBoard's DRAGGABLE_STATUSES) — "active" is real Core account
 * state, not something a drag should fabricate. The roster-list endpoint
 * only returns `{ done, total }`, not which specific step indices are
 * done, so for the two "all or nothing" targets this marks/clears every
 * index rather than guessing which ones are already set (PATCHing an
 * already-matching step is a harmless no-op). For "onboarding" specifically
 * (partial progress), which single step flips depends on which direction
 * the card came from — see the two branches below.
 */
function computeStepChanges(row: NewHireRow, target: NewHireStatus): { index: number; done: boolean }[] {
  const total = row.onboardingTotal ?? 0;
  if (target === "pre-boarding") {
    return Array.from({ length: total }, (_, index) => ({ index, done: false }));
  }
  if (target === "ready-to-work") {
    return Array.from({ length: total }, (_, index) => ({ index, done: true }));
  }
  // target === "onboarding"
  if (row.status === "pre-boarding") return [{ index: 0, done: true }];
  if (row.status === "ready-to-work") return [{ index: total - 1, done: false }];
  return [];
}

/** Reads (and consumes) just-created hire(s) the add-person wizards stashed
 *  in sessionStorage before redirecting here — see this file's header
 *  comment. Employee/Contractor stash a single `NewHireRow` object;
 *  AddBulkWizardPage stashes an array (one create call per CSV row) — both
 *  shapes land under the same key, so this normalizes either into a list.
 *  Called once, from a useState lazy initializer (not an effect): this is
 *  seeding initial state from an external source at mount, not
 *  synchronizing with one over time, so it doesn't need an effect + setState
 *  (and the react-hooks lint rule agrees — see set-state-in-effect). */
function readHandoff(): NewHireRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(NEW_HIRE_HANDOFF_KEY);
    if (!raw) return [];
    sessionStorage.removeItem(NEW_HIRE_HANDOFF_KEY);
    const parsed = JSON.parse(raw) as NewHireRow | NewHireRow[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

interface NewHiresPageProps {
  /** Real since 2026-09-15 (`GET /tenants/:id/members?include=onboarding`,
   *  see `../core-mapper.ts` and docs/people/new-hires-onboarding-roster-
   *  field-requirements.md). `null` when the Core fetch failed or no
   *  tenant/session was resolved — same "explicit error state, not fake
   *  content" discipline as org-structure/personnel. */
  rows: NewHireRow[] | null;
  /** For the drag-and-drop `PATCH .../members/:memberId/onboarding` calls.
   *  `null` disables drag-and-drop (same "no tenant/session resolved" case
   *  as `rows: null`). */
  tenantId: string | null;
}

// HR Manager — new hires Kanban board (`/people/new-hires`), redesigned
// 2026-09-01 from a table + status-tabs layout per the FigJam "People
// Workspace" board (see NewHireKanbanBoard/mock-data.ts's own comments for
// the stage model). `addedRows` is real, client-local state (prepended
// ahead of the fetched roster, never persisted) — "เพิ่มพนักงานใหม่"
// (NewHiresHeader) links to people/add-person's full-page wizard
// (/people/add/employee); on a successful real Core submission there, the
// wizard stashes the created row in sessionStorage (NEW_HIRE_HANDOFF_KEY)
// before its "ไปที่หน้าเข้าใหม่" link brings HR back here, and
// readHandoff() below picks it up once (via a useState lazy initializer, at
// mount) so it still shows up in the right Kanban column even a moment
// before the next real fetch would include it.
export function NewHiresPage({ rows: fetchedRows, tenantId }: NewHiresPageProps) {
  const router = useRouter();
  const [addedRows] = useState<NewHireRow[]>(readHandoff);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  async function handleMoveStage(row: NewHireRow, target: NewHireStatus) {
    if (!tenantId) return;
    setMovingId(row.id);
    try {
      for (const change of computeStepChanges(row, target)) {
        await updateOnboardingStep(tenantId, row.id, change.index, change.done);
      }
      toast.success(`ย้าย ${row.name} ไปยัง ${STAGE_LABEL[target]} แล้ว`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ย้ายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setMovingId(null);
    }
  }

  const rows = useMemo(() => [...addedRows, ...(fetchedRows ?? [])], [addedRows, fetchedRows]);

  // Client-side only — Core's member list has one real server-side filter
  // (?search=, full-text on email/name), but the whole roster is already
  // fetched in one page load here (see app/.../people/new-hires/page.tsx),
  // so filtering what's already in memory is simpler than round-tripping
  // for a dataset this size. วันที่เริ่มงาน (date range) and ผู้จัดการ stay
  // decorative in NewHiresFilterBar — no raw start_date threaded through
  // yet for the former, and no manager data exists in Core at all for the
  // latter (see people/add-person's README on ผู้บังคับบัญชา).
  const unitOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.unit).filter((u) => u !== "-"))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const positionOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.position).filter((p) => p !== "-"))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (unitFilter && row.unit !== unitFilter) return false;
      if (positionFilter && row.position !== positionFilter) return false;
      if (startDateFrom && (!row.startDate || row.startDate < startDateFrom)) return false;
      if (startDateTo && (!row.startDate || row.startDate > startDateTo)) return false;
      if (q && !`${row.name} ${row.position} ${row.unit}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, unitFilter, positionFilter, startDateFrom, startDateTo]);

  return (
    <div className="flex flex-col gap-6">
      <NewHiresHeader />
      <NewHireFunnelRow rows={rows} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <NewHiresFilterBar
            search={search}
            onSearchChange={setSearch}
            unit={unitFilter}
            onUnitChange={setUnitFilter}
            unitOptions={unitOptions}
            position={positionFilter}
            onPositionChange={setPositionFilter}
            positionOptions={positionOptions}
            startDateFrom={startDateFrom}
            onStartDateFromChange={setStartDateFrom}
            startDateTo={startDateTo}
            onStartDateToChange={setStartDateTo}
          />
          {fetchedRows === null ? (
            <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
              ไม่สามารถโหลดข้อมูลเข้าใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
          ) : (
            <NewHireKanbanBoard
              rows={filteredRows}
              onMoveStage={tenantId ? handleMoveStage : undefined}
              movingId={movingId}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <NewHireSidebar rows={rows} />
        </div>
      </div>
    </div>
  );
}
