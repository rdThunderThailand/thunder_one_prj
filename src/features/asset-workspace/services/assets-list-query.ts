import { z } from "zod";
import { ASSET_STATUSES } from "../domain/asset-status";
import { ASSET_CONDITIONS } from "../domain/asset-condition";

export const ASSET_SORT_KEYS = ["created_at", "updated_at", "name", "asset_code"] as const;
export const ASSET_PAGE_SIZES = [10, 25, 50, 100] as const;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().max(200).optional(),
  category_id: z.guid().optional(),
  location_id: z.guid().optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  custody_type: z.enum(["person", "org_unit"]).optional(),
  custody_id: z.guid().optional(),
  import_batch_id: z.guid().optional(),
  sort: z.enum(ASSET_SORT_KEYS).default("created_at"),
  direction: z.enum(["asc", "desc"]).default("desc"),
}).refine((value) => Boolean(value.custody_id) === Boolean(value.custody_type), {
  message: "Choose a custody target with both its type and identifier.",
});

export type AssetListQuery = z.infer<typeof querySchema>;
export type AssetSearchParams = Record<string, string | string[] | undefined>;

export function readAssetListQuery(params: AssetSearchParams) {
  const input: Record<string, string> = {};
  for (const key of Object.keys(querySchema.shape)) {
    const value = params[key];
    if (Array.isArray(value)) return { success: false as const };
    if (value !== undefined && value !== "") input[key] = value;
  }
  return querySchema.safeParse(input);
}

export function assetListQueryString(query: AssetListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}
