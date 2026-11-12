import { z } from "zod";
import { ASSET_STATUSES } from "../domain/asset-status.ts";
import { ASSET_CONDITIONS } from "../domain/asset-condition.ts";

export const ASSET_SORT_KEYS = ["created_at", "status_since"] as const;
export const ASSET_PAGE_SIZES = [10, 25, 50, 100, 200] as const;
export const ASSET_SEARCH_MAX_LENGTH = 100;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  q: z.string().trim().max(ASSET_SEARCH_MAX_LENGTH).transform((value) => value || undefined).optional(),
  category_id: z.guid().optional(),
  include_child_categories: z.enum(["true", "false"]).optional(),
  location_id: z.guid().optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  custody_type: z.enum(["person", "org_unit"]).optional(),
  custody_id: z.guid().optional(),
  import_batch_id: z.uuid().optional(),
  sort: z.enum(ASSET_SORT_KEYS).default("created_at"),
}).strict().refine((value) => !value.custody_id || Boolean(value.custody_type), {
  message: "A custody identifier requires a custody type.",
});

export type AssetListQuery = z.infer<typeof querySchema>;
export type AssetSearchParams = Record<string, string | string[] | undefined>;

export function readAssetListQuery(params: AssetSearchParams) {
  const input: Record<string, string> = {};
  for (const key of Object.keys(querySchema.shape)) {
    // Accept previously bookmarked page_size URLs locally; requests only use pageSize.
    const value = key === "pageSize" ? params.pageSize ?? params.page_size : params[key];
    if (Array.isArray(value)) return { success: false as const };
    if (value !== undefined && value !== "") input[key] = value;
  }
  return querySchema.safeParse(input);
}

export function readAssetListSearch(search: string) {
  const params = new URLSearchParams(search);
  const input: AssetSearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    input[key] = values.length > 1 ? values : values[0];
  }
  return readAssetListQuery(input);
}

export function assetListQueryString(query: AssetListQuery, options: { omitDefaultSort?: boolean } = {}): string {
  const params = new URLSearchParams();
  // The schema is the endpoint allowlist; UI-only and obsolete URL keys never reach Core.
  for (const [key, value] of Object.entries(querySchema.parse(query))) {
    if (options.omitDefaultSort && key === "sort" && value === "created_at") continue;
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}
