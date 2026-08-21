// Real Thunder_Core integration for AM-02 (Add Asset) — the one write this
// feature currently makes against a live endpoint; everything else in this
// feature still reads `mock-assets.ts` (see that file's own header comment
// for why: no list/read endpoint has been given yet, only this create one).
import { requestApi } from "@/lib/api/media-api";
import type { CreateAssetDeviceInput, CreateAssetDeviceResult } from "../types";

/**
 * `POST /tenants/{id}/assets` is tenant-scoped by path param, unlike the
 * media routes (docs/adr/0007-tenant-scoping-from-login.md), which resolve
 * tenant server-side from the app's api key alone. The session endpoint
 * already returns `tenant.id` (docs/adr/0008-session-context-endpoint.md) —
 * `get-session.ts` just doesn't surface it, and can't be imported from a
 * client component anyway (it pulls in `next/headers`). This is the
 * client-safe equivalent, scoped to this one call site until a second
 * consumer needs it.
 */
async function getCurrentTenantId(): Promise<string> {
  const data = await requestApi<{ tenant?: { id?: string } }>("GET", "/session");
  const tenantId = data.tenant?.id;
  if (!tenantId) {
    throw new Error("No tenant resolved for the current session.");
  }
  return tenantId;
}

/**
 * Requires the logged-in user to be `super_admin` or `company_admin` of the
 * resolved tenant — the server returns 403 otherwise, surfaced to the caller
 * via the thrown `ApiError`'s `status` (see `@/lib/api/api-error`).
 */
export async function createAsset(
  input: CreateAssetDeviceInput
): Promise<CreateAssetDeviceResult> {
  const tenantId = await getCurrentTenantId();
  return requestApi<CreateAssetDeviceResult>("POST", `/tenants/${tenantId}/assets`, input);
}
