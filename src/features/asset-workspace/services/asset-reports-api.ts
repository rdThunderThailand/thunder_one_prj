// Core reads for the Reports page (PO 05 §4.13.5; route list in E:\ThunderOne\docs\pr\pr-asset-workspace-reports-fe.md).
// Server-only, like asset-overview-api.ts. Every route is under `/api/core/v2/tenants/{id}/asset-workspace/`.
// Only `assets/list` and `assets/filters` exist on Core today; the others answer 404 until Core ships them, which comes back as
// "unavailable" so the widget says "not available yet" instead of "couldn't load". Any other failure is `null`.
import { env } from "@/config/env";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import type { ListData } from "../components/list-page/AssetWorkspaceListPage";
import type { AssetCondition } from "../domain/asset-condition";
import type { AssetStatus } from "../domain/asset-status";
import type { AgeBucket, AttentionIssue, InventoryResult, SessionStatus, WarrantyStatus } from "../domain/report";
import { assetFiltersSchema, assetListSchema } from "./assets-list-types";

export type ReportResult<T> = T | null | "unavailable";

/** Token + tenant for the Core calls, or `null` (every widget then shows its error state). */
export async function reportAuth() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;
  return token && tenantId ? { token, tenantId } : null;
}

export async function reportGet<T>(path: string, token: string): Promise<ReportResult<T>> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2${path}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 404) return "unavailable";
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data as T) ?? null;
  } catch {
    return null;
  }
}

/** Core list routes are strict (unknown params answer 400), so each route forwards only its own keys. */
export const ASSET_FILTER_KEYS = ["q", "status", "condition", "category_id", "location_id", "custody_type", "custody_id"];
export const INVENTORY_FILTER_KEYS = ["q", "status", "location_id", "from", "to"];
export const WARRANTY_FILTER_KEYS = ["q", "status", "provider", "end_from", "end_to"];
const PAGE_KEYS = ["page", "pageSize"];

export type SearchParams = Record<string, string | string[] | undefined>;

function query(sp: SearchParams, keys: string[]) {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = sp[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

interface Page<Row> {
  data: Row[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Paged Core response → the list scaffold's shape. A route Core hasn't built shows as an empty table. */
function toListData<Row>(page: ReportResult<Page<Row>>): { data: ListData<Row> | null; unavailable: boolean } {
  if (page === "unavailable") return { data: { rows: [], page: 1, pageSize: 25, total: 0, totalPages: 0 }, unavailable: true };
  return { data: page && { rows: page.data, page: page.page, pageSize: page.pageSize, total: page.total, totalPages: page.totalPages }, unavailable: false };
}

export interface NamedCount {
  id: string;
  name: string;
  count: number;
}

export type StatusCounts = Partial<Record<AssetStatus, number>>;

// ── Asset Summary tab ────────────────────────────────────────────────

/** Last calendar month's closing counts (`asset_month_end_states`). `null` while a filter is set (the snapshot has
 *  no category / condition to filter by) or before that month was recorded. */
export interface LastMonthCounts {
  month: string;
  total: number;
  byStatus: StatusCounts;
}

export interface AssetSummaryReport {
  /** All five statuses, Disposed included. */
  total: number;
  byStatus: StatusCounts;
  byCategory: NamedCount[];
  lastMonth?: LastMonthCounts | null;
}

export interface CustodyReport {
  targets: { targetType: "person" | "org_unit"; targetId: string; name: string; count: number }[];
  /** Assets with no open custody. */
  noCustody: number;
}

const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace`;

export const getAssetSummaryReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<AssetSummaryReport>(`${base(tenantId)}/reports/asset-summary${query(sp, ASSET_FILTER_KEYS)}`, token);

/** Direct location only, no roll-up to parents. */
export const getLocationReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<NamedCount[]>(`${base(tenantId)}/reports/by-location${query(sp, ASSET_FILTER_KEYS)}`, token);

export const getCustodyReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<CustodyReport>(`${base(tenantId)}/reports/by-custody${query(sp, ASSET_FILTER_KEYS)}`, token);

/** Existing `assets/list`, parsed with the Assets page's schema so the Reports table reuses `AssetsTable`. */
export async function getAssetRows(token: string, tenantId: string, sp: SearchParams) {
  const parsed = assetListSchema.safeParse(await reportGet<unknown>(`${base(tenantId)}/assets/list${query(sp, [...ASSET_FILTER_KEYS, ...PAGE_KEYS])}`, token));
  return parsed.success ? parsed.data : null;
}

/** Existing `assets/filters`: options for the shared `AssetsFilters` bar. */
export async function getAssetFilters(token: string, tenantId: string) {
  const parsed = assetFiltersSchema.safeParse(await reportGet<unknown>(`${base(tenantId)}/assets/filters`, token));
  return parsed.success ? parsed.data : null;
}

// ── Lifecycle & Condition tab ────────────────────────────────────────

export interface LifecycleReport {
  total: number;
  byStatus: StatusCounts;
  byCondition: Partial<Record<AssetCondition, number>>;
  byCategory: (NamedCount & { byStatus: StatusCounts })[];
  lastMonth?: LastMonthCounts | null;
  // Provisional fields for planned Core PR 7 (rules in domain/report.ts). Missing = Core hasn't shipped them yet.
  /** Assets with an Acquisition Date only. */
  age?: { counted: number; averageMonths: number | null; distribution: { bucket: AgeBucket; count: number }[] } | null;
  nearEndOfLife?: number | null;
  /** One row per category × issue with a count above 0. */
  attention?: { categoryId: string | null; category: string; issue: AttentionIssue; count: number }[] | null;
}

export const getLifecycleReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<LifecycleReport>(`${base(tenantId)}/reports/lifecycle-summary${query(sp, ASSET_FILTER_KEYS)}`, token);

// ── Inventory tab ────────────────────────────────────────────────────

export type ResultCounts = Partial<Record<InventoryResult, number>>;

export interface InventoryReport {
  sessions: { total: number; open: number };
  results: ResultCounts;
  openFindings: number;
  byLocation: (NamedCount & { results: ResultCounts })[];
  topCategories: (NamedCount & { results: ResultCounts })[];
}

export const getInventoryReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<InventoryReport>(`${base(tenantId)}/reports/inventory-summary${query(sp, INVENTORY_FILTER_KEYS)}`, token);

export interface SessionRow {
  id: string;
  name: string;
  referenceNo: string | null;
  scopeLabel: string;
  startedAt: string | null;
  completedAt: string | null;
  progressPct: number;
  results: ResultCounts;
  status: SessionStatus;
}

export async function getSessionRows(token: string, tenantId: string, sp: SearchParams) {
  const page = await reportGet<Page<SessionRow>>(`${base(tenantId)}/inventory-sessions${query(sp, [...INVENTORY_FILTER_KEYS, ...PAGE_KEYS])}`, token);
  return toListData(page);
}

// ── Warranty tab ─────────────────────────────────────────────────────

export interface WarrantyReport {
  totalAssets: number;
  byStatus: Partial<Record<WarrantyStatus, number>>;
  /** Next 90 days, one row per month, `month` = "YYYY-MM". */
  expiringByMonth: { month: string; count: number }[];
  byProvider: { provider: string; count: number }[];
}

export const getWarrantyReport = (token: string, tenantId: string, sp: SearchParams) =>
  reportGet<WarrantyReport>(`${base(tenantId)}/reports/warranty-expiry${query(sp, WARRANTY_FILTER_KEYS)}`, token);

export interface WarrantyRow {
  assetId: string;
  name: string;
  assetTag: string;
  category: { id: string; name: string } | null;
  /** All null when status is No Warranty. */
  provider: string | null;
  warrantyType: string | null;
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
}

export async function getWarrantyRows(token: string, tenantId: string, sp: SearchParams) {
  const page = await reportGet<Page<WarrantyRow>>(`${base(tenantId)}/warranties${query(sp, [...WARRANTY_FILTER_KEYS, ...PAGE_KEYS])}`, token);
  return toListData(page);
}
