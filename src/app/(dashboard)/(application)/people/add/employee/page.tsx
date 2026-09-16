import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { getRoles } from "@/features/people/personnel";
import { AddEmployeeWizardPage } from "@/features/people/add-person";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — "เพิ่มพนักงานใหม่" full-page wizard, successor to
// people/new-hires's old AddEmployeeModal. Same server-side fetch as that
// modal's route used to do: the tenant id, the tenant's real roles (for the
// required role_code), and the real org-unit tree (for a real
// default_department_id) — handed down as props so the wizard can call
// Core's actual POST /tenants/:id/members on submit.
export default async function PeopleAddEmployeePage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <AddEmployeeWizardPage tenantId={null} roles={null} units={null} />;
  }

  const [roles, orgTree] = await Promise.all([getRoles(token, tenantId), getOrganizations(token, tenantId)]);

  const units = orgTree ? mapCoreOrgTree(orgTree, []).units : null;

  return <AddEmployeeWizardPage tenantId={tenantId} roles={roles} units={units} />;
}
