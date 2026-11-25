// Lifecycle tab reads from the browser, through the same proxy path as the Assets page.
import type { z } from "zod";
import { AssetWorkspaceRequestError, requestAssetWorkspace } from "./asset-workspace-api";
import type { SectionSeed } from "./assets-list-seed";
import { assetListSchema, type AssetFilterOptions, type AssetListData, type AssetReadResult } from "./assets-list-types";
import { lifecycleCountsSchema, type LifecycleCounts } from "./lifecycle-tab-types";

export interface LifecycleSeeds {
  list: SectionSeed<AssetListData>;
  counts: SectionSeed<LifecycleCounts>;
  filters: SectionSeed<AssetFilterOptions>;
}

async function read<T>(context: string, path: string, schema: z.ZodType<T>, signal: AbortSignal): Promise<AssetReadResult<T>> {
  const message = "Check your connection, then retry.";
  try {
    const parsed = schema.safeParse(await requestAssetWorkspace("GET", path, undefined, { context, signal, timeout: 20000 }));
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, status: 502, message };
  } catch (error) {
    if (signal.aborted) throw error;
    return { ok: false, status: error instanceof AssetWorkspaceRequestError ? error.status || 503 : 503, message };
  }
}

export const getLifecycleList = (context: string, query: string, signal: AbortSignal) =>
  read(context, query ? `/list?${query}` : "/list", assetListSchema, signal);

export const getLifecycleCounts = (context: string, signal: AbortSignal) =>
  read(context, "/summary", lifecycleCountsSchema, signal);
