// Pure rules behind config/tenant-access.ts, kept free of Next/alias imports so
// tenant-access-rules.check.mts can run them with plain `node`.

export interface TenantAccessInput {
  isSuperAdmin: boolean;
  /** `tenant_applications.role` for Thunder One — "owner" / "viewer" / null. */
  tenantAppRole: string | null;
  /** Core's `/session` `enabled_workspaces`: the App ids a super admin switched
   *  on for this tenant in core_prj_Frontend, or null when Core has no catalog
   *  for Thunder One yet (or is older than the field). */
  enabledWorkspaces: readonly string[] | null;
}

/** Today's rule, kept for when Core sends no `enabled_workspaces` (Nie,
 *  2026-09-29): every non-owner tenant sees only Media Workspace. */
export const LEGACY_NON_OWNER_APP_IDS: ReadonlySet<string> = new Set(["media-workspace"]);

/** Where a page outside every allowed App sends the user. Not gated by any
 *  App, so it cannot redirect-loop. */
export const NO_APP_LANDING = "/profile";

/** `null` means every App. The owner tenant (Thunder Enterprise Master) and a
 *  platform super admin see every App whatever the switches say; an unknown
 *  role (Core didn't send one, or the session failed) also resolves to every
 *  App — fails open, same as getSession(). */
export function allowedAppIds({ isSuperAdmin, tenantAppRole, enabledWorkspaces }: TenantAccessInput): ReadonlySet<string> | null {
  if (isSuperAdmin || tenantAppRole === null || tenantAppRole === "owner") return null;
  if (enabledWorkspaces !== null) return new Set(enabledWorkspaces);
  return LEGACY_NON_OWNER_APP_IDS;
}

export function canOpenApp(allowed: ReadonlySet<string> | null, appId: string): boolean {
  return allowed === null || allowed.has(appId);
}

/** The first allowed App, in launcher order, for a tenant sent away from an
 *  App it may not open; NO_APP_LANDING when it may open none. */
export function deniedAppLanding(
  allowed: ReadonlySet<string> | null,
  apps: readonly { id: string; basePath: string }[],
): string {
  return apps.find((app) => canOpenApp(allowed, app.id))?.basePath ?? NO_APP_LANDING;
}
