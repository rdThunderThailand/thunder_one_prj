import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { mapCoreContractors } from "@/features/people/contractors/core-mapper";
import { getMembers } from "@/features/people/personnel";
import { ContractorsPage } from "@/features/people/contractors";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — the standalone Contractor roster page. Real data since
// 2026-09-15: reuses the same GET /tenants/:id/members people/personnel
// already calls (member_type is real and already returned — see
// contractors/core-mapper.ts and people/personnel/core-mapper.ts's own
// 2026-09-15 correction), filtered to member_type === "contractor". No new
// Core endpoint needed for the roster itself; contract-specific fields
// (company, coordinator, contract dates) stay unbacked — see
// contractors/mock-data.ts's header comment for exactly why.
export default async function PeopleContractorsPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <ContractorsPage rows={null} />;
  }

  const [memberPage, orgTree] = await Promise.all([
    getMembers(token, tenantId, { limit: 100 }),
    getOrganizations(token, tenantId),
  ]);

  if (!memberPage) {
    return <ContractorsPage rows={null} />;
  }

  const { units } = mapCoreOrgTree(orgTree ?? [], []);
  return <ContractorsPage rows={mapCoreContractors(memberPage.rows, units)} />;
}
