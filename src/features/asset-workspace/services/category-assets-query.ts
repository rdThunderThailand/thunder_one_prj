import { readAssetListQuery, type AssetSearchParams } from "./assets-list-query.ts";

export const CATEGORY_ASSET_KEYS = ["q", "status", "location_id", "condition", "page", "pageSize"] as const;

export function readCategoryAssetsSearch(categoryId: string, search: string) {
  const params = new URLSearchParams(search);
  const input: AssetSearchParams = { category_id: categoryId, include_child_categories: "true" };
  for (const key of CATEGORY_ASSET_KEYS) {
    const values = params.getAll(key);
    if (values.length) input[key] = values.length === 1 ? values[0] : values;
  }
  // Scope always comes from the authenticated detail route, never query overrides.
  return readAssetListQuery(input);
}

export function categoryDetailTab(search: string) {
  return new URLSearchParams(search).get("tab") === "assets" ? "assets" : "overview";
}

export function updateCategoryAssetsSearch(search: string, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(updates)) {
    if (key !== "tab" && !CATEGORY_ASSET_KEYS.some((allowed) => allowed === key)) continue;
    if (value) params.set(key, value);
    else params.delete(key);
  }
  if (!("page" in updates) && !("tab" in updates)) params.delete("page");
  return params;
}

export function clearCategoryAssetsSearch(search: string) {
  const params = new URLSearchParams(search);
  for (const key of CATEGORY_ASSET_KEYS) params.delete(key);
  return params;
}
