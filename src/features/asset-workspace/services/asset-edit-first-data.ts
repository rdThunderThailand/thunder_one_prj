// First data of Edit Asset, read from Core on the server. Server-only.
import type { AssetCategoryDetail } from "../domain/asset-category";
import { startActionFirstData, type ActionFirstData } from "./asset-action-first-data";
import { categoryDetailSchema } from "./asset-categories-types";
import { assetServerReader } from "./asset-server-read";
import type { SectionSeed } from "./assets-list-seed";

export interface EditFirstData extends ActionFirstData {
  /** The asset's current category, read as soon as the detail names it. */
  category: SectionSeed<AssetCategoryDetail>;
}

/** `context` and `assetId` must be the ones the page passes to its view: they name the request each seed answers. */
export async function startEditFirstData(token: string, tenantId: string, context: string, assetId: string): Promise<EditFirstData> {
  const [first, read] = await Promise.all([
    startActionFirstData(token, tenantId, context, assetId), assetServerReader(token, tenantId, "categories"),
  ]);
  const category = first.detail.data.then((detail) =>
    detail?.category ? read(`/${encodeURIComponent(detail.category.id)}`, categoryDetailSchema) : null);
  return { ...first, category: { ...first.detail, data: category } };
}
