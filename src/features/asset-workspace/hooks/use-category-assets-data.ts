import { getAssetsFilters, getAssetsList } from "../services/assets-list-api";
import { assetListQueryString, type AssetListQuery } from "../services/assets-list-query";
import { useAssetSection } from "./use-assets-list-data";

export function useCategoryAssetsData(context: string, query: AssetListQuery | null, invalidKey: string) {
  const filters = useAssetSection(context, "category-assets-filters", (signal) => getAssetsFilters(context, signal));
  const key = query ? assetListQueryString(query, { omitDefaultSort: true }) : `invalid:${invalidKey}`;
  const list = useAssetSection(context, key, (signal) => query
    ? getAssetsList(context, query, signal, { omitDefaultSort: true })
    : Promise.resolve({ ok: false as const, status: 400, message: "These category asset filters are invalid." }));
  return { filters, list, key };
}
