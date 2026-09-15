import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AccountSecurityPage } from "@/features/account-security";
import { getMyProfile } from "@/features/profile/services/profile-api";

// New 2026-09-16 — reached from UserMenu's "บัญชีและความปลอดภัย". See
// src/features/account-security/README.md for what's real here (very
// little — checked directly against thunder_core_API).
export default async function AccountSecurityRoute() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantName = session === "forbidden" ? null : session.tenantName;

  const me = token ? await getMyProfile(token) : null;

  return <AccountSecurityPage me={me} tenantName={tenantName} />;
}
