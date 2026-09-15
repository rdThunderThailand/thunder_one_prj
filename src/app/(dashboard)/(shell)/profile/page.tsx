import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { resolveRole, resolveRoleLabel } from "@/config/rbac";
import { ProfilePage } from "@/features/profile";
import { getMyProfile } from "@/features/profile/services/profile-api";

// New 2026-09-16 — reached from UserMenu's "โปรไฟล์ของฉัน"/"การตั้งค่าส่วนบุคคล",
// not the sidebar. See src/features/profile/README.md for what's real here.
export default async function ProfileRoute() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantName = session === "forbidden" ? null : session.tenantName;
  const roleName = session === "forbidden" ? null : (session.roleName ?? resolveRoleLabel(resolveRole(session)));

  const me = token ? await getMyProfile(token) : null;

  return <ProfilePage me={me} tenantName={tenantName} roleName={roleName} />;
}
