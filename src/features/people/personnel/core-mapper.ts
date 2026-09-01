import type { OrgUnitNode } from "@/features/people/org-structure";
import { formatThaiDate } from "@/lib/thai-date";
import type { CoreMemberRow } from "./services/members-api";
import type { PersonnelRow, WorkStatus } from "./mock-data";

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

function unitLabel(departmentId: string | null, units: Record<string, OrgUnitNode>): string {
  if (!departmentId) return "-";
  const unit = units[departmentId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

/**
 * Maps Core's `GET /tenants/:id/members` row shape to this feature's
 * `PersonnelRow` — the same display shape `PersonnelTable` already renders
 * for mock data, so no component changes were needed to wire real data in.
 *
 * `type` is always `"employee"` — Core has no `member_type` column yet
 * (confirmed 2026-08-28, docs/people/core-response-people-workspace-api.md).
 * This is a placeholder, not a real classification: every
 * Contractor/Partner/Guest tab and stat tile is meaningless against real
 * data until that column ships. `managerName`/`managerRole` are always
 * `null` for the same reason `manager_id` isn't in Core's org-units select
 * list yet (see org-structure/services/organizations-api.ts).
 */
export function mapCoreMember(row: CoreMemberRow, units: Record<string, OrgUnitNode>): PersonnelRow {
  return {
    id: row.id,
    name: row.user.full_name,
    email: row.user.email,
    employeeCode: row.employee_code ?? "-",
    position: row.job_title ?? "-",
    unit: unitLabel(row.default_department_id, units),
    type: "employee",
    workStatus: STATUS_MAP[row.status],
    startDateLabel: row.start_date ? formatThaiDate(row.start_date) : "-",
    managerName: null,
    managerRole: null,
  };
}
