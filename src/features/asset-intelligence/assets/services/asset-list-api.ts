// Real Thunder_Core integration for the Asset List page
// (/asset-intelligence/assets/all) — server-only (reads the session cookie's
// bearer token via get-session.ts's getAuthToken(), passed in explicitly
// rather than read again here, so these stay plain functions callable from
// any Server Component).
//
// Field shapes and caveats are documented in Thunder_Core's
// docs/asset-intelligence/asset-list-page-api-gap-analysis.md (2026-08-26).
// The two worth remembering here: `subcategory` is always null today (no
// reliable source in the DB yet), and `building`/`floor`/`room` are null for
// ~98% of assets (the `locations` hierarchy is barely populated) — neither
// is a bug in this integration, both are upstream data-population gaps.
import { env } from "@/config/env";

export const ASSET_LIST_STATUSES = ["Ready", "In Use", "In Progress", "Retired-Cancelled"] as const;
export type AssetListStatus = (typeof ASSET_LIST_STATUSES)[number];

export interface AssetListRow {
  id: string;
  name: string;
  serial: string | null;
  category: string | null;
  subcategory: string | null;
  status: AssetListStatus;
  owner: string | null;
  department: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
  receivedDate: string | null;
  valueTHB: number | null;
}

export interface AssetListPage {
  rows: AssetListRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AssetListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: AssetListStatus;
  building?: string;
  owner?: string;
}

export interface AssetStatusCount {
  status: AssetListStatus;
  count: number;
  percent: number;
}

export interface AssetSummary {
  total: number;
  byStatus: AssetStatusCount[];
}

export interface AssetFilterOptions {
  category: string[];
  status: readonly AssetListStatus[];
  building: string[];
  owner: string[];
}

/**
 * `GET`/`PATCH .../assets/{assetId}` response shape — a strict superset of
 * `AssetListRow` (Thunder_Core's `toAssetDetailRow` spreads `toAssetListRow`),
 * per docs/asset-intelligence/asset-detail-page-api-gap-analysis.md (P1/P3,
 * built 2026-08-26). `assetTag` and `assetCode` are the SAME underlying
 * column (`assets.asset_code`) — both are sent back for convenience, don't
 * treat them as independently editable. `productGroup` (P1) is intentionally
 * absent — Core deferred it pending a product decision on whether it
 * duplicates `category`.
 */
export interface AssetDetail extends AssetListRow {
  assetTag: string | null;
  assetCode: string | null;
  barcode: string | null;
  color: string | null;
  dimensions: string | null;
  /** Kilograms (Core's assumption — see the gap-analysis doc). */
  weight: number | null;
  accessories: string[] | null;
  notes: string | null;
  /** P3 (Lifecycle). `assets.lifecycle_stage` — null for essentially every
   *  asset today (0/509 populated as of 2026-08-26), a real data-population
   *  gap rather than a bug in this integration. */
  currentStage: string | null;
  /** Most recent `asset_status_history` row that changed `currentStage`;
   *  null whenever `currentStage` has never actually changed (true for
   *  every asset today, same reason as above). */
  stageChangedAt: string | null;
}

/**
 * P7 (Activity History). `action` is Core's raw `activity_type` enum
 * (`STATUS_CHANGE` / `DEVICE_LINK` / `DEVICE_UNLINK` / `ATTACHMENT_ADDED`) —
 * map to a Thai label at render time rather than here, so a future enum
 * value degrades to showing the raw string instead of vanishing.
 */
export interface AssetActivityEntry {
  actor: string | null;
  action: string;
  timestamp: string;
  detail: string | null;
}

/**
 * P6 (Related Documents). `fileUrl` is a 1-hour signed URL generated fresh
 * on every read — don't cache it beyond the page load that fetched it.
 */
export interface AssetAttachment {
  id: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
  uploadedBy: string | null;
  docType: string | null;
}

function authHeaders(token: string) {
  return { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}` };
}

/** Fails open (returns `null`) on any transport/HTTP/shape failure — callers
 *  render an empty/fallback state rather than crash the page, same
 *  philosophy as getSession(). */
async function coreGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v1${path}`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data as T) ?? null;
  } catch {
    return null;
  }
}

export async function getAssetList(
  token: string,
  tenantId: string,
  query: AssetListQuery = {},
): Promise<AssetListPage | null> {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 25));
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  if (query.building) params.set("building", query.building);
  if (query.owner) params.set("owner", query.owner);

  const data = await coreGet<{
    data: AssetListRow[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  }>(`/tenants/${tenantId}/assets/list?${params.toString()}`, token);

  if (!data) return null;
  return { rows: data.data, page: data.page, pageSize: data.pageSize, total: data.total, totalPages: data.totalPages };
}

export async function getAssetSummary(token: string, tenantId: string): Promise<AssetSummary | null> {
  return coreGet<AssetSummary>(`/tenants/${tenantId}/assets/summary`, token);
}

export async function getAssetFilters(token: string, tenantId: string): Promise<AssetFilterOptions | null> {
  return coreGet<AssetFilterOptions>(`/tenants/${tenantId}/assets/filters`, token);
}

/**
 * `GET /tenants/{id}/assets/{assetId}` — single-asset read for the Asset
 * Detail page (assets/all/[assetId]/page.tsx). `null` covers both "not
 * found" and any transport/HTTP failure — Core doesn't distinguish them at
 * this layer, so neither does this fetch; the caller shows one "not found or
 * couldn't load" state either way.
 */
export async function getAsset(token: string, tenantId: string, assetId: string): Promise<AssetDetail | null> {
  return coreGet<AssetDetail>(`/tenants/${tenantId}/assets/${assetId}`, token);
}

/**
 * P7 (Activity History). `null` on any failure — the card falls back to an
 * "unavailable" state, distinct from an empty (but successfully loaded) feed.
 */
export async function getAssetActivity(
  token: string,
  tenantId: string,
  assetId: string,
): Promise<AssetActivityEntry[] | null> {
  return coreGet<AssetActivityEntry[]>(`/tenants/${tenantId}/assets/${assetId}/activity`, token);
}

/**
 * P6 (Related Documents). `null` on any failure — same "unavailable" vs.
 * "empty" distinction as getAssetActivity.
 */
export async function getAssetAttachments(
  token: string,
  tenantId: string,
  assetId: string,
): Promise<AssetAttachment[] | null> {
  return coreGet<AssetAttachment[]>(`/tenants/${tenantId}/assets/${assetId}/attachments`, token);
}
