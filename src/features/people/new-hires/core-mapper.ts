import type { OrgUnitNode } from "@/features/people/org-structure";
import { formatDaysUntilThai, formatThaiDate } from "@/lib/thai-date";
import type { CoreOnboardingRow } from "./services/onboarding-api";
import type { NewHireRow, NewHireStatus } from "./mock-data";

function unitLabel(departmentId: string | null, units: Record<string, OrgUnitNode>): string {
  if (!departmentId) return "-";
  const unit = units[departmentId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

/**
 * Derives the Kanban's 4-stage `NewHireStatus` from real data — Core has no
 * stage/lifecycle column (never built, see docs/people/new-hires-onboarding-
 * roster-field-requirements.md), only `onboarding.done`/`total` (the
 * checklist) and `status` (account state: invited/active/suspended/removed/
 * archived).
 *
 * **Fixed 2026-09-15**: `status` must be checked *first*, not last — a
 * member who's already `active` (e.g. a seed/pre-existing account like the
 * tenant admin, or anyone whose account predates this checklist ever being
 * populated) can genuinely have `onboarding.done === 0` despite already
 * being fully active and working. The original version checked `done === 0`
 * before `status`, so every already-active member with an empty checklist
 * landed in "pre-boarding" regardless of their real account state — caught
 * live when `admin@thunder.co.th` (status: active) showed up there instead
 * of "active". `status: "active"` is the stronger, more authoritative
 * signal and should short-circuit the checklist-based reasoning entirely;
 * checklist progress only matters for members who haven't gone active yet.
 */
function deriveStatus(row: CoreOnboardingRow): NewHireStatus {
  if (row.status === "active") return "active";
  const { done, total } = row.onboarding;
  if (done === 0) return "pre-boarding";
  if (done < total) return "onboarding";
  return "ready-to-work";
}

export function mapOnboardingRoster(rows: CoreOnboardingRow[], units: Record<string, OrgUnitNode>): NewHireRow[] {
  return rows.map((row) => {
    const { done, total } = row.onboarding;
    return {
      id: row.id,
      name: row.user.full_name,
      employeeCode: row.employee_code ?? "-",
      position: row.job_title ?? "-",
      unit: unitLabel(row.default_department_id, units),
      startDateLabel: row.start_date ? formatThaiDate(row.start_date) : "-",
      daysLeftLabel: row.start_date ? formatDaysUntilThai(row.start_date) : "-",
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      status: deriveStatus(row),
      managerName: null,
      managerRole: null,
      // Not rendered anywhere in the current Kanban (NewHireKanbanBoard only
      // reads name/position/status/progress/startDateLabel) — the roster-
      // list endpoint intentionally doesn't return the full per-step detail
      // the per-member GET .../onboarding does, so there's nothing real to
      // put here yet. Empty, not fabricated.
      steps: [],
      onboardingDone: done,
      onboardingTotal: total,
      startDate: row.start_date,
    };
  });
}
