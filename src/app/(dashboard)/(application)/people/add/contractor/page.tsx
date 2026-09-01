import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { getRoles } from "@/features/people/personnel";
import { AddContractorWizardPage } from "@/features/people/add-person";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — "เพิ่มผู้รับเหมา / ผู้ปฏิบัติงานภายนอก (Contractor)" full-page
// wizard. Same server-side fetch as people/add/employee's route: the tenant
// id, the tenant's real roles (for the required role_code), and the real
// org-unit tree (for a real default_department_id) — Contractor intake
// calls the exact same Core POST /tenants/:id/members Employee intake does
// (see AddContractorWizardPage's own comment for why).
export default async function PeopleAddContractorPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <AddContractorWizardPage tenantId={null} roles={null} units={null} />;
  }

  const [roles, orgTree] = await Promise.all([getRoles(token, tenantId), getOrganizations(token, tenantId)]);

  const units = orgTree ? mapCoreOrgTree(orgTree, []).units : null;

  return <AddContractorWizardPage tenantId={tenantId} roles={roles} units={units} />;
}
