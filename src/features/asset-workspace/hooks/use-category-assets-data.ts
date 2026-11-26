import { getAssetsFilters, getAssetsList } from "../services/assets-list-api";
import { assetListQueryString, type AssetListQuery } from "../services/assets-list-query";
import { CATEGORY_ASSETS_FILTERS_KEY } from "../services/category-assets-query";
import type { CategoryAssetsSeeds } from "../services/category-first-data";
import { useAssetSection } from "./use-assets-list-data";

export function useCategoryAssetsData(context: string, query: AssetListQuery | null, invalidKey: string, seeds?: CategoryAssetsSeeds) {
  const filters = useAssetSection(context, CATEGORY_ASSETS_FILTERS_KEY, (signal) => getAssetsFilters(context, signal), seeds?.filters);
  const key = query ? assetListQueryString(query, { omitDefaultSort: true }) : `invalid:${invalidKey}`;
  const list = useAssetSection(context, key, (signal) => query
    ? getAssetsList(context, query, signal, { omitDefaultSort: true })
    : Promise.resolve({ ok: false as const, status: 400, message: "These category asset filters are invalid." }), seeds?.list);
  return { filters, list, key };
}
