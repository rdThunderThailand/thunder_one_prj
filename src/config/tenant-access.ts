import { redirect } from "next/navigation";
import type { SessionResult } from "@/features/auth/services/get-session";

// Which Apps a tenant may open, keyed on its `tenant_applications.role` for
// Thunder One (Nie, 2026-09-29). The owner tenant (Thunder Enterprise
// Master) sees every App; any other tenant — role "viewer" today — sees
// only the Apps listed here — except for a platform super admin, who sees
// every App in any tenant they switch into (Nie, 2026-09-29). Like
// config/rbac.ts this is a courtesy layer:
// Core still enforces tenant boundaries on every request.
const NON_OWNER_APP_IDS: ReadonlySet<string> = new Set(["media-workspace"]);

const NON_OWNER_LANDING = "/media-workspace";

/** `null` means every App. An unknown role (Core didn't send one, or the
 *  session failed) also resolves to every App — fails open, same as
 *  getSession(). */
export function resolveAllowedAppIds(session: SessionResult): ReadonlySet<string> | null {
  if (session === "forbidden") return null;
  const { tenantAppRole, isSuperAdmin } = session;
  if (isSuperAdmin || tenantAppRole === null || tenantAppRole === "owner") return null;
  return NON_OWNER_APP_IDS;
}

export function canOpenApp(allowed: ReadonlySet<string> | null, appId: string): boolean {
  return allowed === null || allowed.has(appId);
}

/** Call from an App's layout. Sends a tenant that may not open this App to
 *  the non-owner landing page instead. */
export function requireAppAccess(session: SessionResult, appId: string): void {
  if (canOpenApp(resolveAllowedAppIds(session), appId)) return;
  redirect(NON_OWNER_LANDING);
}
