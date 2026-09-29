// The tenant a user picked in the Sidebar's tenant switcher, sent to Core as
// `x-tenant-id` on every server-side call. Core's requireMediaTenant then
// resolves /session and the media routes to that tenant (403 if the caller may
// not enter it); `/tenants/:id/...` routes follow along because their id comes
// from /session. No cookie means Core's own default tenant, same as before
// the switcher existed.
//
// `next/headers` is imported lazily: core-get.ts pulls this module in, and
// core-get.ts reaches client bundles through service files some client
// components import for their types/mappers — a static import of
// `next/headers` there fails the build even though it only ever runs on the
// server.
export const TENANT_COOKIE = "to_tenant";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isTenantId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export async function getSelectedTenantId(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const value = (await cookies()).get(TENANT_COOKIE)?.value;
  return isTenantId(value) ? value : null;
}

/** Spread into a Core request's headers. */
export async function selectedTenantHeader(): Promise<Record<string, string>> {
  const tenantId = await getSelectedTenantId();
  return tenantId ? { "x-tenant-id": tenantId } : {};
}
