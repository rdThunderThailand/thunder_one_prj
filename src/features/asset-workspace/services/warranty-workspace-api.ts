// Core reads for the Warranty tab. Server-only, through the Reports helpers, so the
// shared browser proxy stays untouched (owner 2026-11-13: new work must not touch existing features).
import type { ListData } from "../components/list-page/AssetWorkspaceListPage";
import type { WarrantyStatus } from "../domain/report";
import { WARRANTY_LIST_KEYS } from "../domain/warranty-list";
import { query, reportAuth, reportGet, toListData, type Page, type SearchParams } from "./asset-reports-api";

const PAGE_KEYS = ["page", "pageSize"];
const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace`;

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
