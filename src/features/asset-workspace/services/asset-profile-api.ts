import type { z } from "zod";
import { requestAssetWorkspace, AssetWorkspaceRequestError } from "./asset-workspace-api";
import type { AssetReadResult } from "./assets-list-types";
import {
  assetHistoryPageSchema, assetDetailSchema, assetFilesSchema, assetStatusHistoryPageSchema, assetWarrantiesSchema,
  type AssetHistoryPage, type AssetDetail, type AssetFiles, type AssetStatusHistoryPage, type AssetWarranty,
} from "./asset-profile-contract";

export type ProfileReadResult<T> = AssetReadResult<T> & { code?: string };

async function readProfile<T>(context: string, path: string, schema: z.ZodType<T>, signal: AbortSignal): Promise<ProfileReadResult<T>> {
  try {
    const parsed = schema.safeParse(await requestAssetWorkspace("GET", path, undefined, { context, signal, timeout: 20000 }));
    return parsed.success ? { ok: true, data: parsed.data }
      : { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "The asset service returned an unexpected response. Try again." };
  } catch (error) {
    if (signal.aborted) throw error;
    const status = error instanceof AssetWorkspaceRequestError ? error.status || 503 : 503;
    const code = error instanceof AssetWorkspaceRequestError ? error.code : "UNREACHABLE";
    // Another organization's asset is a 404 too, so "not found" never confirms that it exists.
    const message = code === "NOT_FOUND" ? "This asset doesn't exist in your organization, or it is no longer available."
      : code === "UNAUTHENTICATED" ? "Your session has expired. Sign in again to view this asset."
        : code === "PERMISSION_DENIED" ? "You don't have permission, or your account or organization changed. Reload the page to check your access."
          : "The asset service couldn't complete this request. Check your connection and retry.";
    return { ok: false, status, code, message };
  }
}

const base = (assetId: string) => `/${encodeURIComponent(assetId)}`;

export function getAssetDetail(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetDetail>> {
  return readProfile(context, base(assetId), assetDetailSchema, signal);
}
export function getAssetFiles(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetFiles>> {
  return readProfile(context, `${base(assetId)}/files`, assetFilesSchema, signal);
}
export function getAssetWarranties(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetWarranty[]>> {
  return readProfile(context, `${base(assetId)}/warranties`, assetWarrantiesSchema, signal);
}
export const HISTORY_PAGE_SIZE = 20;
export type HistoryQuery = { page: number; q: string; eventType: string | null; dateFrom: string | null; dateTo: string | null };
/** BE 03: search, type and dates are filtered by Core, never one page in the browser. Dates are Bangkok days. */
export function getAssetHistory(context: string, assetId: string, query: HistoryQuery, signal: AbortSignal): Promise<ProfileReadResult<AssetHistoryPage>> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(HISTORY_PAGE_SIZE) });
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.eventType) params.set("event_type", query.eventType);
  if (query.dateFrom) params.set("date_from", query.dateFrom);
  if (query.dateTo) params.set("date_to", query.dateTo);
  return readProfile(context, `${base(assetId)}/history?${params}`, assetHistoryPageSchema, signal);
}
export const STATUS_HISTORY_PAGE_SIZE = 20;
/** `status` is one of the five PO statuses, or null for all (BE 01). */
export function getAssetStatusHistory(context: string, assetId: string, page: number, status: string | null,
  signal: AbortSignal, pageSize = STATUS_HISTORY_PAGE_SIZE): Promise<ProfileReadResult<AssetStatusHistoryPage>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  return readProfile(context, `${base(assetId)}/status-history?${params}`, assetStatusHistoryPageSchema, signal);
}
