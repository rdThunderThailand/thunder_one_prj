import { z } from "zod";
import { CATEGORY_STATUSES } from "../domain/asset-category.ts";

// PostgreSQL seed IDs can use non-RFC version/variant bits; retain UUID shape validation.
const reference = z.object({ id: z.guid(), name: z.string().min(1) });
const count = z.number().int().nonnegative();

export const categorySchema = z.object({
  id: z.guid(), name: z.string().min(1), code: z.string().min(1),
  parentId: z.guid().nullable(), parent: reference.nullable(),
  description: z.string().nullable(), isSerialRequired: z.boolean(),
  status: z.enum(CATEGORY_STATUSES), ownAssetCount: count, assetCount: count,
  childCount: count, updatedAt: z.string().datetime({ offset: true }),
});

export const categoryListSchema = z.array(categorySchema).refine(
  (rows) => new Set(rows.map((row) => row.id)).size === rows.length,
  "Category identifiers must be unique.",
);

export const categoryDetailSchema = categorySchema.extend({
  children: z.array(reference.extend({ status: z.enum(CATEGORY_STATUSES), assetCount: count })),
});
