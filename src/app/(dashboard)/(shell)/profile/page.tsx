import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { resolveRole, resolveRoleLabel } from "@/config/rbac";
import { ProfilePage } from "@/features/profile";
import { getMyMembership, getMyProfile } from "@/features/profile/services/profile-api";
import { getOrganizations, type CoreOrgUnit } from "@/features/people/org-structure/services/organizations-api";

function findDepartmentName(units: CoreOrgUnit[], id: string): string | null {
  for (const unit of units) {
    if (unit.id === id) return unit.name;
    const found = findDepartmentName(unit.children, id);
    if (found) return found;
  }
  return null;
}

// New 2026-09-16 — reached from UserMenu's "โปรไฟล์ของฉัน"/"การตั้งค่าส่วนบุคคล",
// not the sidebar. See src/features/profile/README.md for what's real here.
export default async function ProfileRoute() {
  const token = await getAuthToken();
  // Parallel wherever the data allows: /me only needs the token, and the org
  // tree only needs the session's tenant — so the critical path is
  // max(session, /me) → membership, instead of four calls in a row.
  const sessionPromise = getSession();
  const mePromise = token ? getMyProfile(token) : Promise.resolve(null);
  const organizationsPromise = sessionPromise
    .then((s) => (token && s !== "forbidden" && s.tenantId ? getOrganizations(token, s.tenantId) : null))
    .catch(() => null);
  const [session, me] = await Promise.all([sessionPromise, mePromise]);

  const tenantName = session === "forbidden" ? null : session.tenantName;
  const tenantId = session === "forbidden" ? null : session.tenantId;
  // Same preference as (dashboard)/layout.tsx's Topbar: the real job title
  // over the RBAC tier label, falling back to it only when the member has
  // no job_title set.
  const roleName =
    session === "forbidden" ? null : (session.jobTitle ?? session.roleName ?? resolveRoleLabel(resolveRole(session)));

  // Best-effort — see getMyMembership's own doc comment for why this isn't
  // a "real" self-service endpoint and what it falls back to on failure.
  const membership = token && tenantId && me ? await getMyMembership(token, tenantId, me.id, me.email) : null;
  const departmentName = membership?.default_department_id
    ? findDepartmentName((await organizationsPromise) ?? [], membership.default_department_id)
    : null;

  return (
    <ProfilePage
      me={me}
      tenantName={tenantName}
      roleName={roleName}
      membership={membership}
      departmentName={departmentName}
    />
  );
}
