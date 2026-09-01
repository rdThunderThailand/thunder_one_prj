import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { getRoles } from "@/features/people/personnel";
import { NewHiresPage } from "@/features/people/new-hires";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — new hires roster + onboarding detail panel ("เข้าใหม่"). The
// roster itself is still mock (people/new-hires/mock-data.ts — no Lifecycle/
// onboarding schema exists in Core yet, confirmed 2026-08-28,
// docs/people/core-response-people-workspace-api.md). Only the *creation*
// flow is real: this route fetches what AddEmployeeModal needs to call
// Core's actual POST /tenants/:id/members — the tenant id, the tenant's
// real roles (for the required role_code), and the real org-unit tree (for
// a real default_department_id) — and hands them down as props rather than
// having the modal fetch them itself client-side.
export default async function PeopleNewHiresPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <NewHiresPage tenantId={null} roles={null} units={null} />;
  }

  const [roles, orgTree] = await Promise.all([getRoles(token, tenantId), getOrganizations(token, tenantId)]);

  const units = orgTree ? mapCoreOrgTree(orgTree, []).units : null;

  return <NewHiresPage tenantId={tenantId} roles={roles} units={units} />;
}
