import type { OrgUnitNode } from "@/features/people/org-structure";
import { formatThaiDate } from "@/lib/thai-date";
import type { CoreMemberRow } from "./services/members-api";
import type { PersonnelRow, PersonnelType, WorkStatus } from "./mock-data";

/** Core's `memberships.status` is account-access state, not this feature's
 *  `workStatus` concept — closest fit, not a 1:1 mapping. `suspended` reads
 *  closer to "on-leave" than "inactive" for an HR roster view; `removed`/
 *  `archived` both collapse to "inactive". */
const STATUS_MAP: Record<CoreMemberRow["status"], WorkStatus> = {
  invited: "invited",
  active: "active",
  suspended: "on-leave",
  removed: "inactive",
  archived: "inactive",
};

/** "removed"/"archived" wins over `member_type`: someone no longer with the
 *  org reads as "inactive" regardless of what kind of member they were,
 *  matching the mockup's own 5th type. */
function resolveType(row: CoreMemberRow): PersonnelType {
  if (row.status === "removed" || row.status === "archived") return "inactive";
  return row.member_type ?? "employee";
}

function unitLabel(departmentId: string | null, units: Record<string, OrgUnitNode>): string {
  if (!departmentId) return "-";
  const unit = units[departmentId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

/** "N ปี M เดือน" (or just "N เดือน"/"N วัน" for a very new hire) since a
 *  real start_date. Whole-months-and-years, not exact days, matching how
 *  HR usually talks about tenure ("3 เดือน", not "92 วัน"). */
function tenureLabel(startDate: string, now: Date): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "-";
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return "-";
  if (months < 1) return "น้อยกว่า 1 เดือน";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} เดือน`;
  return remMonths === 0 ? `${years} ปี` : `${years} ปี ${remMonths} เดือน`;
}

/**
 * Maps Core's `GET /tenants/:id/members` row shape to this feature's
 * `PersonnelRow` — the same display shape `PersonnelTable` already renders
 * for mock data, so no component changes were needed to wire real data in.
 *
 * `type` — **fixed 2026-09-15**: was hardcoded `"employee"` on the belief
 * Core had no `member_type` column (confirmed 2026-08-28,
 * docs/people/core-response-people-workspace-api.md); that was stale —
 * `member_type` was real by that same day and Core's `MEMBER_SELECT`
 * already returns it, this frontend's type just hadn't been updated to
 * read it. Now resolved via `resolveType()`. `managerName`/`managerRole`
 * are still always `null` — `manager_id` isn't in Core's org-units select
 * list yet (see org-structure/services/organizations-api.ts).
 */
/** Real "อยู่ระหว่างทดลองงาน" (still probationary) vs "ปกติ" (confirmed) —
 *  derived from `probationEndDate` vs. today, not stored as its own
 *  boolean/enum, so there's one source of truth for both the table's badge
 *  and the "พนักงานทดลองงาน" tab's filter. */
export function isOnProbation(probationEndDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!probationEndDate) return false;
  const end = new Date(probationEndDate);
  return !Number.isNaN(end.getTime()) && end.getTime() >= now.getTime();
}

export function mapCoreMember(row: CoreMemberRow, units: Record<string, OrgUnitNode>): PersonnelRow {
  const now = new Date();
  return {
    id: row.id,
    userId: row.user.id,
    name: row.user.full_name,
    firstNameTh: row.user.first_name_th,
    lastNameTh: row.user.last_name_th,
    nameTh: [row.user.first_name_th, row.user.last_name_th].filter(Boolean).join(" ") || null,
    email: row.user.email,
    employeeCode: row.employee_code ?? "-",
    position: row.job_title ?? "-",
    positionCode: row.position_code,
    levelRole: row.level_role,
    unit: unitLabel(row.default_department_id, units),
    departmentId: row.default_department_id,
    type: resolveType(row),
    workStatus: STATUS_MAP[row.status],
    startDateLabel: row.start_date ? formatThaiDate(row.start_date) : "-",
    startDate: row.start_date,
    tenureLabel: row.start_date ? tenureLabel(row.start_date, now) : "-",
    avatarUrl: row.user.avatar_url,
    probationEndDate: row.probation_end_date,
    managerName: null,
    managerRole: null,
  };
}
