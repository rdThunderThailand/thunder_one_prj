import { redirect } from "next/navigation";
import { APPS } from "@/config/apps";
import type { SessionResult } from "@/features/auth/services/get-session";
import { allowedAppIds, canOpenApp, deniedAppLanding } from "@/config/tenant-access-rules";

// Which Apps a tenant may open. A platform super admin switches each App on
// or off per tenant in core_prj_Frontend (Tenant › Applications); Core sends
// the result as `/session` `enabled_workspaces` (Thunder_Core
// docs/api/application-workspaces.md). The owner tenant (Thunder Enterprise
// Master) and a platform super admin see every App (Nie, 2026-09-29). Rules:
// config/tenant-access-rules.ts. Like config/rbac.ts this is a courtesy
// layer: Core still enforces tenant boundaries on every request.

export { canOpenApp };

/** `null` means every App. */
export function resolveAllowedAppIds(session: SessionResult): ReadonlySet<string> | null {
  if (session === "forbidden") return null;
  return allowedAppIds(session);
}

/** Call from an App's layout. Sends a tenant that may not open this App to
 *  the first App it may open instead. */
export function requireAppAccess(session: SessionResult, appId: string): void {
  const allowed = resolveAllowedAppIds(session);
  if (canOpenApp(allowed, appId)) return;
  redirect(deniedAppLanding(allowed, APPS));
}
