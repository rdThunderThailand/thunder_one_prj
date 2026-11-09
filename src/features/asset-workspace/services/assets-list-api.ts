import { z } from "zod";
import { requestAssetWorkspace, AssetWorkspaceRequestError } from "./asset-workspace-api";
import { assetListQueryString, type AssetListQuery } from "./assets-list-query";
import {
  assetFiltersSchema,
  assetListSchema,
  assetSummarySchema,
  type AssetReadResult,
} from "./assets-list-types";

async function readAssets<T>(
  context: string,
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<AssetReadResult<T>> {
  try {
    const body = await requestAssetWorkspace("GET", path, undefined, { context, signal, timeout: 20000 });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return { ok: false, status: 502, message: "The asset service returned an unexpected response. Try again." };
    }
    return { ok: true, data: parsed.data };
  } catch (error) {
    if (signal.aborted) throw error;
    const status = error instanceof AssetWorkspaceRequestError ? error.status || 503 : 503;
    const validationMessage = error instanceof AssetWorkspaceRequestError && error.code === "VALIDATION" && path.startsWith("/list?")
      ? error.message : "These filters are invalid. Clear them and try again.";
    const message = status === 401 ? "Your session has expired. Sign in again to load assets."
      : status === 403 ? "You don't have permission, or your account or organization changed. Reload the page to check your access."
        : status === 400 ? validationMessage
          : status === 502 ? "The asset service returned an unexpected response. Try again."
            : "The asset service couldn't complete this request. Check your connection and retry.";
    return { ok: false, status, message };
  }
}

export function getAssetsList(context: string, query: AssetListQuery, signal: AbortSignal, options?: { omitDefaultSort?: boolean }) {
  return readAssets(context, `/list?${assetListQueryString(query, options)}`, assetListSchema, signal);
}

export function getAssetsSummary(context: string, signal: AbortSignal) {
  return readAssets(context, "/summary", assetSummarySchema, signal);
}

export function getAssetsFilters(context: string, signal: AbortSignal) {
  return readAssets(context, "/filters", assetFiltersSchema, signal);
}
