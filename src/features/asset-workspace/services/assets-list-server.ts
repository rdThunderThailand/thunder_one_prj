// The Assets page's first data, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and each section streams in when it is ready.
// Every failure is `null`: the browser then loads that section and shows its own message.
import type { z } from "zod";
import { env } from "@/config/env";
import { selectedTenantHeader } from "@/lib/core/tenant-selection";
import { getWorkspacePreferences } from "./asset-settings-api";
import { assetListQueryString, type AssetListDefaults, type AssetSearchParams } from "./assets-list-query";
import { firstAssetListQuery, FILTERS_KEY, SUMMARY_KEY, type AssetsListSeeds } from "./assets-list-seed";
import { assetFiltersSchema, assetListSchema, assetSummarySchema } from "./assets-list-types";

const READ_TIMEOUT_MS = 8000;

export interface AssetsFirstData { listDefaults?: AssetListDefaults; seeds: AssetsListSeeds }

export async function startAssetsFirstData(token: string, tenantId: string, params: AssetSearchParams): Promise<AssetsFirstData> {
  const headers = { "x-api-key": env.coreApiKey ?? "", Authorization: `Bearer ${token}`, ...(await selectedTenantHeader()) };

  async function read<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${encodeURIComponent(tenantId)}/asset-workspace/assets${path}`, {
        headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const body = await res.json();
      const parsed = schema.safeParse(body?.success === true ? body.data : null);
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  const at = Date.now();
  const summary = { key: SUMMARY_KEY, at, data: read("/summary", assetSummarySchema) };
  const filters = { key: FILTERS_KEY, at, data: read("/filters", assetFiltersSchema) };
  // The org's page size and sort start the list when the URL names none; any failure keeps the built-in defaults.
  const saved = await getWorkspacePreferences();
  const listDefaults = saved ? { pageSize: saved.pageSize, sort: saved.sort } : undefined;
  const query = firstAssetListQuery(params, listDefaults);
  const key = query ? assetListQueryString(query) : null;
  const list = key === null ? null : { key, at, data: read(`/list?${key}`, assetListSchema) };
  return { listDefaults, seeds: { list, summary, filters } };
}
