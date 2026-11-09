import { z } from "zod";
import { CATEGORY_PAGE_SIZES, CATEGORY_SORT_KEYS, CATEGORY_STATUSES } from "../domain/asset-category.ts";

export const CATEGORY_SEARCH_MAX_LENGTH = 255;
const categoryId = z.guid().transform((value) => value.toLowerCase());

const schema = z.object({
  q: z.string().trim().max(CATEGORY_SEARCH_MAX_LENGTH).default(""),
  status: z.enum(CATEGORY_STATUSES).optional(),
  parent: z.union([z.literal("top-level"), categoryId]).optional(),
  sort: z.enum(CATEGORY_SORT_KEYS).default("default"),
  direction: z.enum(["asc", "desc"]).default("asc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().refine((value) => CATEGORY_PAGE_SIZES.includes(value as 10 | 25 | 50)).default(10),
  expanded: z.preprocess((value) => typeof value === "string" ? value.split(",") : value,
    z.array(categoryId).max(1000).default([])),
});

export const CATEGORY_QUERY_KEYS = Object.keys(schema.shape);

export function readCategoryListSearch(search: string) {
  const params = new URLSearchParams(search);
  const input: Record<string, string> = {};
  for (const key of CATEGORY_QUERY_KEYS) {
    const values = params.getAll(key);
    if (values.length > 1) return { success: false as const };
    if (values[0]) input[key] = values[0];
  }
  return schema.safeParse(input);
}
