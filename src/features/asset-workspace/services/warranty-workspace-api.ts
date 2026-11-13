// Core reads for the Lifecycle & Warranty page (batch FE 01–03). Server-only, through the Reports helpers, so the
// shared browser proxy stays untouched (owner 2026-11-13: new work must not touch existing features).
import { z } from "zod";
import type { ListData } from "../components/list-page/AssetWorkspaceListPage";
import { ASSET_CONDITIONS, type AssetCondition } from "../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../domain/asset-status";
import { LIFECYCLE_FILTER_KEYS } from "../domain/lifecycle-list";
import type { WarrantyStatus } from "../domain/report";
import { WARRANTY_LIST_KEYS } from "../domain/warranty-list";
import {
  getAssetFilters, getAssetRows, query, reportAuth, reportGet, toListData, type Page, type SearchParams,
} from "./asset-reports-api";
import type { AssetFilterOptions, AssetListRow } from "./assets-list-types";

const PAGE_KEYS = ["page", "pageSize"];
const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace`;

/** Unfiltered counts for the four tiles (`byCondition` is Core BE 01, Disposed already left out). */
const summarySchema = z.object({
  byStatus: z.array(z.object({ status: z.enum(ASSET_STATUSES), count: z.number() })),
  byCondition: z.array(z.object({ condition: z.enum(ASSET_CONDITIONS), count: z.number() })),
}).transform(({ byStatus, byCondition }) => ({
  byStatus: Object.fromEntries(byStatus.map((entry) => [entry.status, entry.count])) as Partial<Record<AssetStatus, number>>,
  byCondition: Object.fromEntries(byCondition.map((entry) => [entry.condition, entry.count])) as Partial<Record<AssetCondition, number>>,
}));
export type LifecycleCounts = z.infer<typeof summarySchema>;

export interface LifecycleTabData {
  signedIn: boolean;
  counts: LifecycleCounts | null;
  list: ListData<AssetListRow> | null;
  filters: AssetFilterOptions | null;
}

export async function getLifecycleTab(sp: SearchParams): Promise<LifecycleTabData> {
  const auth = await reportAuth();
  if (!auth) return { signedIn: false, counts: null, list: null, filters: null };
  // Only this tab's keys reach Core; `tab` and the Warranty tab's keys stay out.
  const own = Object.fromEntries([...LIFECYCLE_FILTER_KEYS, ...PAGE_KEYS].map((key) => [key, sp[key]]));
  const [summary, rows, filters] = await Promise.all([
    reportGet<unknown>(`${base(auth.tenantId)}/assets/summary`, auth.token),
    getAssetRows(auth.token, auth.tenantId, own),
    getAssetFilters(auth.token, auth.tenantId),
  ]);
  const counts = summarySchema.safeParse(summary);
  return {
    signedIn: true,
    counts: counts.success ? counts.data : null,
    list: rows && { rows: rows.rows, page: rows.page, pageSize: rows.pageSize, total: rows.total, totalPages: rows.totalPages },
    filters,
  };
}

export interface WarrantyListRow {
  assetId: string;
  name: string;
  assetTag: string;
  /** Current warranty; null with No Warranty (Core BE 01). */
  warrantyId: string | null;
  provider: string | null;
  warrantyType: string | null;
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
}

export interface WarrantyCounts {
  byStatus: Partial<Record<WarrantyStatus, number>>;
  byProvider: { provider: string; count: number }[];
  byWarrantyType?: { warrantyType: string; count: number }[];
}

export interface WarrantyTabData {
  signedIn: boolean;
  /** Unfiltered: tiles and the Provider / Warranty Type options. */
  counts: WarrantyCounts | null;
  list: ListData<WarrantyListRow> | null;
}

export async function getWarrantyTab(sp: SearchParams): Promise<WarrantyTabData> {
  const auth = await reportAuth();
  if (!auth) return { signedIn: false, counts: null, list: null };
  const [report, page] = await Promise.all([
    reportGet<WarrantyCounts>(`${base(auth.tenantId)}/reports/warranty-expiry`, auth.token),
    reportGet<Page<WarrantyListRow>>(`${base(auth.tenantId)}/warranties${query(sp, [...WARRANTY_LIST_KEYS, ...PAGE_KEYS])}`, auth.token),
  ]);
  return {
    signedIn: true,
    counts: report && report !== "unavailable" ? report : null,
    // A missing route reads as a failure here, not an empty table: Core BE 01 is merged.
    list: page === "unavailable" ? null : toListData(page).data,
  };
}
