// The Assets page's first data, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and each section streams in when it is ready.
// Every failure is `null`: the browser then loads that section and shows its own message.
import { assetServerReader } from "./asset-server-read";
import { getWorkspacePreferences } from "./asset-settings-api";
import { assetListQueryString, type AssetListDefaults, type AssetSearchParams } from "./assets-list-query";
import { firstAssetListQuery, FILTERS_KEY, SUMMARY_KEY, type AssetsListSeeds } from "./assets-list-seed";
import { assetFiltersSchema, assetListSchema, assetSummarySchema } from "./assets-list-types";

export interface AssetsFirstData { listDefaults?: AssetListDefaults; seeds: AssetsListSeeds }

export async function startAssetsFirstData(token: string, tenantId: string, params: AssetSearchParams): Promise<AssetsFirstData> {
  const read = await assetServerReader(token, tenantId);
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
