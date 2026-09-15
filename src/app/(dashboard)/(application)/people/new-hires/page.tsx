import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { mapOnboardingRoster } from "@/features/people/new-hires/core-mapper";
import { getOnboardingRoster } from "@/features/people/new-hires/services/onboarding-api";
import { NewHiresPage } from "@/features/people/new-hires";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// HR Manager — new hires roster + onboarding Kanban ("เข้าใหม่"). Real data
// since 2026-09-15 from the proposed `GET /tenants/:id/members?include=
// onboarding` (docs/people/new-hires-onboarding-roster-field-requirements.md)
// — see new-hires/core-mapper.ts for how that maps into the Kanban's 4
// stages. The real "add employee" creation flow lives at its own route
// (people/add/employee/page.tsx, people/add-person's AddEmployeeWizardPage).
export default async function PeopleNewHiresPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <NewHiresPage rows={null} />;
  }

  const [onboardingRows, orgTree] = await Promise.all([
    getOnboardingRoster(token, tenantId),
    getOrganizations(token, tenantId),
  ]);

  if (!onboardingRows) {
    return <NewHiresPage rows={null} />;
  }

  const { units } = mapCoreOrgTree(orgTree ?? [], []);
  return <NewHiresPage rows={mapOnboardingRoster(onboardingRows, units)} />;
}
