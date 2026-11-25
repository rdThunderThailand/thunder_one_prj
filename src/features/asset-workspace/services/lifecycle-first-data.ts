// First data of the Lifecycle tab, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and each part shows when it is ready.
// Every failure is `null`: the browser then loads that part and shows its own message.
import { lifecycleListQuery } from "../domain/lifecycle-list";
import type { SearchParams } from "./asset-reports-api";
import { assetServerReader } from "./asset-server-read";
import { FILTERS_KEY, SUMMARY_KEY } from "./assets-list-seed";
import { assetFiltersSchema, assetListSchema } from "./assets-list-types";
import type { LifecycleSeeds } from "./lifecycle-tab-api";
import { lifecycleCountsSchema } from "./lifecycle-tab-types";

export async function startLifecycleTab(token: string, tenantId: string, params: SearchParams): Promise<LifecycleSeeds> {
  const read = await assetServerReader(token, tenantId);
  const at = Date.now();
  const search = new URLSearchParams(Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? ""]).map((item) => [key, item]))).toString();
  const query = lifecycleListQuery(search);
  return {
    list: { key: query, at, data: read(query ? `/list?${query}` : "/list", assetListSchema) },
    counts: { key: SUMMARY_KEY, at, data: read("/summary", lifecycleCountsSchema) },
    filters: { key: FILTERS_KEY, at, data: read("/filters", assetFiltersSchema) },
  };
}
