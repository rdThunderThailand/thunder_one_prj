// Real Thunder_Core integration for asset writes — AM-02 (Add Asset, the
// original write here) and now Edit Asset (updateAsset below). Everything
// else in this feature still reads `mock-assets.ts` except the List page
// itself, which reads live via services/asset-list-api.ts (server-only —
// this file stays client-safe, for components like AddAssetForm/
// EditAssetModal that call it directly from a "use client" component).
import { requestApi } from "@/lib/api/media-api";
import { ApiError } from "@/lib/api/api-error";
import type { AssetAttachment, AssetListRow } from "./asset-list-api";
import type { CreateAssetDeviceInput, CreateAssetDeviceResult, UpdateAssetInput } from "../types";

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

/**
 * `PATCH /tenants/{id}/assets/{assetId}` — does not exist in Thunder_Core yet
 * (confirmed 2026-08-26: no `[assetId]` route under `tenants/[id]/assets/`
 * at all). Calling this today will 404. Written now so `EditAssetModal.tsx`
 * has a real call site ready the moment Core ships the route — see
 * `UpdateAssetInput`'s header comment (../types/index.ts) for the exact
 * contract this expects back, and the asset-admin-real-data-and-rbac-backlog
 * memory for status.
 */
export async function updateAsset(assetId: string, input: UpdateAssetInput): Promise<AssetListRow> {
  const tenantId = await getCurrentTenantId();
  return requestApi<AssetListRow>("PATCH", `/tenants/${tenantId}/assets/${assetId}`, input);
}

/**
 * `POST /tenants/{id}/assets/{assetId}/attachments` — `multipart/form-data`
 * (Core's handler reads `request.formData()`, not JSON). Goes straight
 * through native `fetch` rather than `requestApi`'s axios instance: the
 * instance sets a blanket `Content-Type: application/json` header
 * (`lib/api/client.ts`) which axios won't let a `FormData` body override,
 * silently sending the file as the wrong content type. `requireTenantManagerOrAbove`
 * on Core's side — same write bar as create/edit.
 */
export async function uploadAssetAttachment(
  assetId: string,
  file: File,
  docType?: string,
): Promise<AssetAttachment> {
  const tenantId = await getCurrentTenantId();
  const formData = new FormData();
  formData.append("file", file);
  if (docType) formData.append("docType", docType);

  const res = await fetch(`/api/proxy/tenants/${tenantId}/assets/${assetId}/attachments`, {
    method: "POST",
    body: formData,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((body as { error?: string } | null)?.error ?? `HTTP Error ${res.status}`, res.status);
  }
  return (body as { data: AssetAttachment }).data;
}

/** `DELETE /tenants/{id}/assets/{assetId}/attachments/{attachmentId}` — same write bar as upload. */
export async function deleteAssetAttachment(assetId: string, attachmentId: string): Promise<void> {
  const tenantId = await getCurrentTenantId();
  await requestApi<void>("DELETE", `/tenants/${tenantId}/assets/${assetId}/attachments/${attachmentId}`);
}
