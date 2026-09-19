import { mapCoreOrgTree } from "@/features/people/org-structure/core-mapper";
import { getOrganizations } from "@/features/people/org-structure/services/organizations-api";
import { mapCoreMember, WORK_STATUS_TO_CORE_STATUS } from "@/features/people/personnel/core-mapper";
import { getMembers, type MemberListQuery } from "@/features/people/personnel/services/members-api";
import { PersonnelPage } from "@/features/people/personnel";
import type { PersonnelType, WorkStatus } from "@/features/people/personnel/mock-data";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

interface PeoplePersonnelPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const REAL_MEMBER_TYPES: PersonnelType[] = ["employee", "contractor", "partner", "guest"];

// HR Manager — the full org roster ("บุคลากร"). Real data from Core's
// GET /tenants/:id/members + GET /tenants/:id/organizations (the latter only
// to resolve `default_department_id` into a "Division / Team" label — see
// features/people/personnel/core-mapper.ts). `?search=` was the one real
// query param; `?type=`/`?status=` joined it 2026-09-17 (Core commit
// de57b3e added real `member_type`/`status` filters to this endpoint) —
// PersonnelFilterBar now pushes its ประเภทบุคลากร/สถานะการทำงาน selections
// here instead of only filtering the already-fetched, `limit:100`-capped
// page client-side, closing the correctness gap where a tenant with >100
// active members would silently lose anyone past the cap to those filters.
// "inactive" is excluded from both — see WORK_STATUS_TO_CORE_STATUS's and
// REAL_MEMBER_TYPES' own comments for why — and stays client-side in
// PersonnelPage, same as หน่วยงาน/ตำแหน่ง (no server filter for those at all).
export default async function PeoplePersonnelPage({ searchParams }: PeoplePersonnelPageProps) {
  const sp = await searchParams;
  const search = firstParam(sp.search);
  const typeParam = firstParam(sp.type);
  const statusParam = firstParam(sp.status);
  const memberType =
    typeParam && REAL_MEMBER_TYPES.includes(typeParam as PersonnelType)
      ? (typeParam as MemberListQuery["member_type"])
      : undefined;
  const status = statusParam ? WORK_STATUS_TO_CORE_STATUS[statusParam as WorkStatus] : undefined;

  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  if (!token || !tenantId) {
    return <PersonnelPage rows={null} totalCount={0} tenantId={null} units={{}} />;
  }

  const [memberPage, orgTree] = await Promise.all([
    getMembers(token, tenantId, { limit: 100, search, member_type: memberType, status }),
    getOrganizations(token, tenantId),
  ]);

  const { units } = mapCoreOrgTree(orgTree ?? [], []);

  if (!memberPage) {
    return <PersonnelPage rows={null} totalCount={0} tenantId={tenantId} units={units} />;
  }

  const rows = memberPage.rows.map((row) => mapCoreMember(row, units));

  return <PersonnelPage rows={rows} totalCount={memberPage.count} tenantId={tenantId} units={units} />;
}
