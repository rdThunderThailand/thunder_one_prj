import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { getMembers } from "@/features/people/personnel";
import { OrgStructurePage } from "@/features/people/org-structure";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — org chart + unit detail panel ("โครงสร้างองค์กร"). Real data
// from Core's GET /tenants/:id/organizations (already a full nested tree —
// see features/people/org-structure/core-mapper.ts), plus GET
// /tenants/:id/members to compute each unit's real employeeCount and resolve
// headName/headTitle from manager_id (Core has no computed
// employeeCount/fillRate/etc. on the organizations endpoint itself — see
// core-mapper.ts's header comment).
export default async function PeopleOrgStructurePage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <OrgStructurePage units={null} rootUnitId={null} />;
  }

  const [orgTree, memberPage] = await Promise.all([
    getOrganizations(token, tenantId),
    getMembers(token, tenantId, { limit: 100 }),
  ]);

  if (!orgTree) {
    return <OrgStructurePage units={null} rootUnitId={null} />;
  }

  const { units, rootUnitId } = mapCoreOrgTree(orgTree, memberPage?.rows ?? []);

  return <OrgStructurePage units={units} rootUnitId={rootUnitId} />;
}
