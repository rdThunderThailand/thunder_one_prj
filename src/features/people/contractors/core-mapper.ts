import type { OrgUnitNode } from "@/features/people/org-structure";
import type { CoreMemberRow } from "@/features/people/personnel";
import { formatThaiDate } from "@/lib/thai-date";
import type { ContractorRow, ContractorStatus } from "./mock-data";

function unitLabel(departmentId: string | null, units: Record<string, OrgUnitNode>): string {
  if (!departmentId) return "-";
  const unit = units[departmentId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}

/**
 * `ContractorStatus` was designed around contract-lifecycle dates
 * (active/expiring-soon/expired/pending-approval) that Core doesn't expose
 * at list level (see mock-data.ts's header comment) — there is no real
 * signal to ever populate "expiring-soon" from, and mapping account status
 * onto a contract-lifecycle label is an approximation, not a fact. Kept
 * honest about what it actually reflects: real account state, relabeled
 * onto the closest-fitting existing tab rather than inventing a new one.
 * `suspended`/`removed`/`archived` all collapse to "expired" (closest
 * available meaning: no longer actively engaged) — this will never be
 * exactly "the contract's end date passed," since Core doesn't track that
 * at list level yet.
 */
function deriveStatus(status: CoreMemberRow["status"]): ContractorStatus {
  switch (status) {
    case "active":
      return "active";
    case "invited":
      return "pending-approval";
    case "suspended":
    case "removed":
    case "archived":
      return "expired";
  }
}

export function mapCoreContractors(rows: CoreMemberRow[], units: Record<string, OrgUnitNode>): ContractorRow[] {
  return rows
    .filter((row) => row.member_type === "contractor")
    .map((row) => ({
      id: row.id,
      name: row.user.full_name,
      code: row.employee_code ?? "-",
      company: null,
      role: row.job_title ?? "-",
      unit: unitLabel(row.default_department_id, units),
      coordinatorName: null,
      coordinatorRole: null,
      contractStartLabel: row.start_date ? formatThaiDate(row.start_date) : null,
      contractEndLabel: null,
      status: deriveStatus(row.status),
    }));
}
