import { z } from "zod";
import { ASSET_STATUSES } from "../domain/asset-status";
import { ASSET_CONDITIONS } from "../domain/asset-condition";

const referenceSchema = z.object({ id: z.string(), name: z.string().nullable() });
const custodySchema = referenceSchema.extend({ type: z.enum(["person", "org_unit"]) });

export const assetRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetTag: z.string(),
  serialNumber: z.string().nullable(),
  category: referenceSchema.nullable(),
  location: referenceSchema.nullable(),
  // Legacy values must remain visible without guessing their canonical meaning.
  lifecycleStatus: z.string(),
  condition: z.string().nullable(),
  custody: custodySchema.nullable(),
  acquisitionDate: z.string().nullable(),
  registrationDate: z.string(),
  updatedAt: z.string(),
  statusSince: z.string(),
  // Reports Lifecycle table only; status is Core's Asia/Bangkok bucket (Active / Expiring Soon / Expired).
  currentWarranty: z.object({ endDate: z.string().nullable(), status: z.string() }).nullable().optional(),
}).transform((row) => ({
  // Adapt Core's transport names once; list consumers retain the feature's row model.
  id: row.id, name: row.name, asset_code: row.assetTag, serial_number: row.serialNumber,
  asset_category_id: row.category?.id ?? null, category_name: row.category?.name ?? null,
  location_id: row.location?.id ?? null, location_name: row.location?.name ?? null,
  status: row.lifecycleStatus, condition: row.condition, custody: row.custody,
  purchase_date: row.acquisitionDate, created_at: row.registrationDate,
  updated_at: row.updatedAt, status_since: row.statusSince,
  current_warranty: row.currentWarranty ?? null,
}));

export const assetListSchema = z.object({
  data: z.array(assetRowSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(200),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
}).transform(({ data, ...pagination }) => ({ rows: data, ...pagination }));

export const assetSummarySchema = z.object({
  byStatus: z.array(z.object({
    status: z.enum(ASSET_STATUSES),
    count: z.number().int().nonnegative(),
  })).length(ASSET_STATUSES.length).refine((entries) => new Set(entries.map((entry) => entry.status)).size === ASSET_STATUSES.length),
  unmapped: z.number().int().nonnegative(),
}).transform(({ byStatus, unmapped }) => {
  const total = byStatus.reduce((sum, entry) => sum + entry.count, unmapped);
  return { total, unmapped, byStatus: byStatus.map((entry) => ({
    ...entry, percent: total === 0 ? 0 : entry.count / total * 100,
  })) };
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
