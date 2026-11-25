// First data of Add / Edit Warranty, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and each part shows when it is ready.
// Every failure is `null`: the browser then loads that part and shows its own message.
import { assetDetailSchema, type AssetDetail } from "./asset-profile-contract";
import { registrationOptionsSchema, type RegistrationOptions } from "./asset-registration-contract";
import { assetServerReader } from "./asset-server-read";
import type { SectionSeed } from "./assets-list-seed";
import { assetFiltersSchema, assetListSchema, type AssetFilterOptions, type AssetListData } from "./assets-list-types";
import { FIRST_WARRANTY_SEARCH, warrantyAssetsPath, warrantyRecordsSchema, type WarrantyRecord } from "./warranty-write";

export interface WarrantyFirstData {
  options: SectionSeed<RegistrationOptions>;
  /** The asset is in the URL. */
  detail?: SectionSeed<AssetDetail>;
  records?: SectionSeed<WarrantyRecord[]>;
  /** The page starts with Select Asset. */
  list?: SectionSeed<AssetListData>;
  filters?: SectionSeed<AssetFilterOptions>;
}

/** `context` and `assetId` must be the ones the page passes to its view: they name the request each seed answers. */
export async function startWarrantyFirstData(token: string, tenantId: string, context: string, assetId: string | null): Promise<WarrantyFirstData> {
  const read = await assetServerReader(token, tenantId);
  const at = Date.now();
  const options = { key: context, at, data: read("/registration-options", registrationOptionsSchema) };
  if (!assetId) {
    return {
      options,
      list: { key: JSON.stringify(FIRST_WARRANTY_SEARCH), at, data: read(warrantyAssetsPath(FIRST_WARRANTY_SEARCH), assetListSchema) },
      filters: { key: context, at, data: read("/filters", assetFiltersSchema) },
    };
  }
  const key = `${context}:${assetId}`;
  const path = `/${encodeURIComponent(assetId)}`;
  return {
    options,
    detail: { key, at, data: read(path, assetDetailSchema) },
    records: { key, at, data: read(`${path}/warranties`, warrantyRecordsSchema) },
  };
}
