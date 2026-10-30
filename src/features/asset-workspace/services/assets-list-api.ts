import "server-only";
import { z } from "zod";
import { env } from "@/config/env";
import { assetListQueryString, type AssetListQuery } from "./assets-list-query";
import {
  assetFiltersSchema,
  assetListSchema,
  assetSummarySchema,
  type AssetReadResult,
} from "./assets-list-types";

interface AssetRequestContext {
  token: string;
  tenantId: string;
}

async function readAssets<T>(
  context: AssetRequestContext,
  path: string,
  schema: z.ZodType<T>,
): Promise<AssetReadResult<T>> {
  if (!env.coreApiUrl || !env.coreApiKey) {
    return { ok: false, status: 503, message: "The asset service is not configured. Contact your administrator." };
  }
  try {
    const base = `${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(context.tenantId)}/asset-workspace/assets`;
    const response = await fetch(`${base}/${path}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${context.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      // Keep HTTP distinctions, but do not send backend diagnostics or query details to the browser.
      const message = response.status === 401
        ? "Your session has expired. Sign in again to load assets."
        : response.status === 403
          ? "You don't have permission to view assets in this organization."
          : response.status === 400
            ? "These filters are invalid. Clear them and try again."
            : "The asset service couldn't complete this request. Try again.";
      return { ok: false, status: response.status, message };
    }
    const parsed = z.object({ success: z.literal(true), data: schema }).safeParse(body);
    if (!parsed.success) {
      return { ok: false, status: 502, message: "The asset service returned an unexpected response. Try again." };
    }
    return { ok: true, data: parsed.data.data };
  } catch {
    return { ok: false, status: 503, message: "The asset service is unavailable. Check your connection and retry." };
  }
}

export function getAssetsList(context: AssetRequestContext, query: AssetListQuery) {
  return readAssets(context, `list?${assetListQueryString(query)}`, assetListSchema);
}

export function getAssetsSummary(context: AssetRequestContext) {
  return readAssets(context, "summary", assetSummarySchema);
}

export function getAssetsFilters(context: AssetRequestContext) {
  return readAssets(context, "filters", assetFiltersSchema);
}
