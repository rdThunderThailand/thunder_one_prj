import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { derivePositionOptions, getMembers, getRoles } from "@/features/people/personnel";
import { AddBulkWizardPage } from "@/features/people/add-person";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — "เพิ่มหลายคนเข้าองค์กร (Bulk)" full-page flow. Same
// server-side fetch as AddEmployeeWizardPage's route: tenant id, real roles
// (required `role_code` on every row's create call), and the real org-unit
// tree (for a real `default_department_id`) — the wizard loops Core's
// existing single-row create endpoints once per parsed CSV row on submit.
// Also fetches the real roster (2026-09-17) purely to derive the position
// autocomplete's option list — see personnel/core-mapper.ts's
// derivePositionOptions.
export default async function PeopleAddBulkPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <AddBulkWizardPage tenantId={null} roles={null} units={null} positionOptions={[]} />;
  }

  const [roles, orgTree, memberPage] = await Promise.all([
    getRoles(token, tenantId),
    getOrganizations(token, tenantId),
    getMembers(token, tenantId, { limit: 100 }),
  ]);
  const units = orgTree ? mapCoreOrgTree(orgTree, []).units : null;
  const positionOptions = derivePositionOptions(memberPage?.rows ?? []);

  return <AddBulkWizardPage tenantId={tenantId} roles={roles} units={units} positionOptions={positionOptions} />;
}
