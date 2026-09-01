import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { mapCoreMember } from "@/features/people/personnel/core-mapper";
import { getMembers } from "@/features/people/personnel/services/members-api";
import { PersonnelPage } from "@/features/people/personnel";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

interface PeoplePersonnelPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// HR Manager — the full org roster ("บุคลากร"). Real data from Core's
// GET /tenants/:id/members + GET /tenants/:id/organizations (the latter only
// to resolve `default_department_id` into a "Division / Team" label — see
// features/people/personnel/core-mapper.ts). `?search=` is the one real
// query param; every other PersonnelFilterBar dropdown stays decorative
// (Core has no server-side filter for them yet).
export default async function PeoplePersonnelPage({ searchParams }: PeoplePersonnelPageProps) {
  const sp = await searchParams;
  const search = firstParam(sp.search);

  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <PersonnelPage rows={null} totalCount={0} />;
  }

  const [memberPage, orgTree] = await Promise.all([
    getMembers(token, tenantId, { limit: 100, search }),
    getOrganizations(token, tenantId),
  ]);

  if (!memberPage) {
    return <PersonnelPage rows={null} totalCount={0} />;
  }

  const { units } = mapCoreOrgTree(orgTree ?? [], []);
  const rows = memberPage.rows.map((row) => mapCoreMember(row, units));

  return <PersonnelPage rows={rows} totalCount={memberPage.count} />;
}
