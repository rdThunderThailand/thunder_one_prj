"use client";

import { useMemo, useState } from "react";
// Deep import (bypassing people/add-person's index.ts) so this file doesn't
// pull in AddEmployeeWizardPage — which itself imports this feature's
// mock-data.ts — and create a barrel-file import cycle between new-hires
// and add-person.
import { NEW_HIRE_HANDOFF_KEY } from "@/features/people/add-person/handoff";
import type { NewHireRow } from "../mock-data";
import { NewHireFunnelRow } from "./NewHireFunnelRow";
import { NewHireKanbanBoard } from "./NewHireKanbanBoard";
import { NewHireSidebar } from "./NewHireSidebar";
import { NewHiresFilterBar } from "./NewHiresFilterBar";
import { NewHiresHeader } from "./NewHiresHeader";

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
   *  content" discipline as org-structure/personnel. The funnel header
   *  counts (`NewHireFunnelRow`) and sidebar (`NewHireSidebar`) are still
   *  mock — not in this round's scope. */
  rows: NewHireRow[] | null;
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
export function NewHiresPage({ rows: fetchedRows }: NewHiresPageProps) {
  const [addedRows] = useState<NewHireRow[]>(readHandoff);

  const rows = useMemo(() => [...addedRows, ...(fetchedRows ?? [])], [addedRows, fetchedRows]);

  return (
    <div className="flex flex-col gap-6">
      <NewHiresHeader />
      <NewHireFunnelRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <NewHiresFilterBar />
          {fetchedRows === null ? (
            <p className="rounded-xl border border-dashed border-zinc-200 p-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
              ไม่สามารถโหลดข้อมูลเข้าใหม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
            </p>
          ) : (
            <NewHireKanbanBoard rows={rows} />
          )}
        </div>
        <div className="lg:col-span-1">
          <NewHireSidebar />
        </div>
      </div>
    </div>
  );
}
