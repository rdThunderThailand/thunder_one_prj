import type { Metadata } from "next";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { resolveRole, resolveRoleLabel } from "@/config/rbac";
import { AccountSecurityPage } from "@/features/account-security";
import { getMyProfile } from "@/features/profile/services/profile-api";

export const metadata: Metadata = { title: "บัญชีและความปลอดภัย" };

// New 2026-09-16 — reached from UserMenu's "บัญชีและความปลอดภัย". See
// src/features/account-security/README.md for what's real here (very
// little — checked directly against thunder_core_API).
export default async function AccountSecurityRoute() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantName = session === "forbidden" ? null : session.tenantName;
  // Same preference as Topbar/ProfilePage: the real job title over the RBAC
  // tier label.
  const roleName =
    session === "forbidden" ? null : (session.jobTitle ?? session.roleName ?? resolveRoleLabel(resolveRole(session)));

  const me = token ? await getMyProfile(token) : null;

  return <AccountSecurityPage me={me} tenantName={tenantName} roleName={roleName} />;
}
