// First data of the category pages, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and each part shows when it is ready.
// Every failure is `null`: the browser then loads that part and shows its own message.
import { z } from "zod";
import type { AssetCategory, AssetCategoryDetail } from "../domain/asset-category";
import { assetServerReader } from "./asset-server-read";
import { categoryDetailSchema, categoryListSchema } from "./asset-categories-types";
import { assetListQueryString } from "./assets-list-query";
import type { SectionSeed } from "./assets-list-seed";
import { assetFiltersSchema, assetListSchema, type AssetFilterOptions, type AssetListData } from "./assets-list-types";
import { CATEGORY_ASSETS_FILTERS_KEY, categoryDetailTab, readCategoryAssetsSearch } from "./category-assets-query";

export interface CategoryAssetsSeeds {
  /** `null`: the URL is invalid, so there is no list to read. */
  list: SectionSeed<AssetListData> | null;
  filters: SectionSeed<AssetFilterOptions>;
}

export interface CategoryDetailFirstData {
  detail: SectionSeed<AssetCategoryDetail>;
  /** Only when the page opens on the Assets tab. */
  assets?: CategoryAssetsSeeds;
}

type SearchParams = Record<string, string | string[] | undefined>;

/** `context` must be the one the page passes to its view: it names the request the seed answers. */
export async function startCategoryList(token: string, tenantId: string, context: string): Promise<SectionSeed<AssetCategory[]>> {
  const read = await assetServerReader(token, tenantId, "categories");
  return { key: context, at: Date.now(), data: read("/list", categoryListSchema) };
}

export async function startCategoryDetail(token: string, tenantId: string, context: string, categoryId: string,
  params: SearchParams = {}): Promise<CategoryDetailFirstData | undefined> {
  if (!z.guid().safeParse(categoryId).success) return undefined;
  const read = await assetServerReader(token, tenantId, "categories");
  const at = Date.now();
  const detail = { key: `${context}:${categoryId}`, at, data: read(`/${encodeURIComponent(categoryId)}`, categoryDetailSchema) };
  const search = new URLSearchParams(Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value ?? ""]).map((item) => [key, item]))).toString();
  if (categoryDetailTab(search) !== "assets") return { detail };
  const readAssets = await assetServerReader(token, tenantId);
  const parsed = readCategoryAssetsSearch(categoryId, search);
  const key = parsed.success ? assetListQueryString(parsed.data, { omitDefaultSort: true }) : null;
  return { detail, assets: {
    list: key === null ? null : { key, at, data: readAssets(`/list?${key}`, assetListSchema) },
    filters: { key: CATEGORY_ASSETS_FILTERS_KEY, at, data: readAssets("/filters", assetFiltersSchema) },
  } };
}
