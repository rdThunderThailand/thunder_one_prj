import { z } from "zod";
import { ASSET_STATUSES } from "../domain/asset-status";
import { ASSET_CONDITIONS } from "../domain/asset-condition";

const referenceSchema = z.object({ id: z.string(), name: z.string().nullable() });
const custodySchema = referenceSchema.extend({ type: z.enum(["person", "org_unit"]) });

export const assetRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  asset_code: z.string().nullable(),
  serial_number: z.string().nullable(),
  asset_category_id: z.string().nullable(),
  category_name: z.string().nullable(),
  location_id: z.string().nullable(),
  location_name: z.string().nullable(),
  // Legacy values must remain visible without guessing their canonical meaning.
  status: z.string().nullable(),
  condition: z.string().nullable(),
  custody: custodySchema.nullable(),
  purchase_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  model: z.string().nullable(),
  asset_type: z.string().nullable(),
  brand: z.string().nullable(),
});

export const assetListSchema = z.object({
  rows: z.array(assetRowSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const assetSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  byStatus: z.array(z.object({
    status: z.enum(ASSET_STATUSES),
    count: z.number().int().nonnegative(),
    percent: z.number().min(0).max(100),
  })),
});

export const assetFiltersSchema = z.object({
  categories: z.array(referenceSchema),
  locations: z.array(referenceSchema),
  custodyTargets: z.array(custodySchema),
  statuses: z.array(z.enum(ASSET_STATUSES)),
  conditions: z.array(z.enum(ASSET_CONDITIONS)),
});

export type AssetListRow = z.infer<typeof assetRowSchema>;
export type AssetListData = z.infer<typeof assetListSchema>;
export type AssetSummaryData = z.infer<typeof assetSummarySchema>;
export type AssetFilterOptions = z.infer<typeof assetFiltersSchema>;
export type AssetReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export interface AssetsPageData {
  list: AssetReadResult<AssetListData>;
  summary: AssetReadResult<AssetSummaryData>;
  filters: AssetReadResult<AssetFilterOptions>;
}
