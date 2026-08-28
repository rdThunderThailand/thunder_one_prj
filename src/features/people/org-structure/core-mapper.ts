import type { CoreMemberRow } from "@/features/people/personnel";
import type { OrgUnitNode } from "./mock-data";
import type { CoreOrgUnit } from "./services/organizations-api";

/**
 * Flattens Core's nested `GET /tenants/:id/organizations` tree into the same
 * `Record<string, OrgUnitNode>` shape `mock-data.ts` uses, so
 * OrgChartNode/OrgChartCanvas/OrgDetailPanel don't need to know whether
 * they're rendering mock or real data.
 *
 * `members` (Core's `GET /tenants/:id/members` rows — the type is imported
 * from people/personnel rather than duplicated) backs two things per node:
 * - `employeeCount` — direct members (`default_department_id === node.id`)
 *   plus every descendant's, matching how the mock data's counts already
 *   work (Sales's 23 = Enterprise's 12 + Partnership's 11).
 * - `headName`/`headTitle` — resolved by matching `node.manager_id` (a raw
 *   `public.users.id`) against a member's `user_id` (NOT `id`, the
 *   membership id — a mismatch here silently resolves nothing rather than
 *   erroring, so this comment is the only place that distinction is
 *   written down). `headTitle` is the manager's `job_title`, not their
 *   system `role_code` — matches the mock data's original meaning
 *   ("Sales Director", not "operator_technician").
 *
 * `positionsCount`/`fillRate` are always null — no backing concept exists in
 * Core's schema at all yet (see this feature's own services/organizations-api.ts
 * header comment).
 */
export function mapCoreOrgTree(
  tree: CoreOrgUnit[],
  members: CoreMemberRow[]
): { units: Record<string, OrgUnitNode>; rootUnitId: string | null } {
  const employeeCountByDepartmentId = new Map<string, number>();
  const memberByUserId = new Map<string, CoreMemberRow>();
  for (const member of members) {
    memberByUserId.set(member.user_id, member);
    if (member.default_department_id) {
      employeeCountByDepartmentId.set(
        member.default_department_id,
        (employeeCountByDepartmentId.get(member.default_department_id) ?? 0) + 1
      );
    }
  }

  const units: Record<string, OrgUnitNode> = {};
  let rootUnitId: string | null = null;

  function visit(node: CoreOrgUnit, parentId: string | null): number {
    const childIds = node.children.map((child) => child.id);
    const directCount = employeeCountByDepartmentId.get(node.id) ?? 0;
    const descendantCount = node.children.reduce((sum, child) => sum + visit(child, node.id), 0);
    const employeeCount = directCount + descendantCount;
    const manager = node.manager_id ? memberByUserId.get(node.manager_id) : undefined;

    units[node.id] = {
      id: node.id,
      name: node.name,
      headName: manager?.user.full_name ?? null,
      headTitle: manager?.job_title ?? null,
      employeeCount,
      unitCode: node.code ?? "-",
      unitType: node.department_type ?? "-",
      teamsCount: childIds.length,
      positionsCount: null,
      fillRate: null,
      parentId,
      childIds,
    };

    if (node.is_root) rootUnitId = node.id;
    return employeeCount;
  }

  for (const root of tree) {
    visit(root, root.parent_department_id);
  }

  // Fall back to the first top-level node if Core never marks one `is_root`.
  if (!rootUnitId && tree.length > 0) rootUnitId = tree[0].id;

  return { units, rootUnitId };
}
