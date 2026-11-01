import { z } from "zod";

export const selectorKinds = ["categories", "locations", "orgUnits", "persons"] as const;
export type SelectorKind = typeof selectorKinds[number];
export const referenceItemSchema = z.object({
  id: z.guid().transform((id) => id.toLowerCase()), name: z.string().nullable(), code: z.string().nullable().optional(),
  parent_id: z.guid().nullable().optional(), parent: z.object({ id: z.guid(), name: z.string().nullable() }).nullable().optional(),
  icon_url: z.string().nullable().optional(), color_code: z.string().nullable().optional(), is_serial_required: z.boolean().optional(),
  location_type: z.string().nullable().optional(), employee_code: z.string().nullable().optional(), secondary_label: z.string().optional(),
});
export type ReferenceItem = z.infer<typeof referenceItemSchema>;
export const selectedReferencesSchema = z.object({
  categories: referenceItemSchema.nullable().default(null), locations: referenceItemSchema.nullable().default(null),
  orgUnits: referenceItemSchema.nullable().default(null), persons: referenceItemSchema.nullable().default(null),
});
export type SelectedReferences = z.infer<typeof selectedReferencesSchema>;
export type ReferenceValidation = Partial<Record<SelectorKind, { id: string; status: "pending" | "valid" | "unavailable" | "error"; message?: string }>>;
export const selectorQuerySchema = z.object({
  kind: z.enum(selectorKinds), q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(), page_size: z.coerce.number().int().min(1).max(100).optional(),
  parent_id: z.guid().optional(), id: z.guid().optional(), cursor: z.guid().optional(),
}).strict().superRefine((query, ctx) => {
  const invalid = query.kind === "persons" ? query.parent_id || (query.page ?? 1) > 1 : query.cursor;
  if (invalid || query.q && query.parent_id || query.id && (query.q || query.parent_id || query.cursor || (query.page ?? 1) > 1)) {
    ctx.addIssue({ code: "custom", message: "Invalid selector query combination." });
  }
});
export type SelectorQuery = z.infer<typeof selectorQuerySchema>;
export function selectorPageSchema(kind: SelectorKind) {
  const item = kind === "categories" ? referenceItemSchema.extend({ is_serial_required: z.boolean() }) : kind === "persons"
    ? referenceItemSchema.extend({ secondary_label: z.string(), employee_code: z.string().nullable() }) : referenceItemSchema;
  const base = z.object({ items: z.array(item), pageSize: z.number().int().positive(), hasMore: z.boolean() });
  return kind === "persons" ? base.extend({ nextCursor: z.guid().nullable(), searchComplete: z.boolean() })
    .refine((page) => page.hasMore ? Boolean(page.nextCursor) && !page.searchComplete : page.nextCursor === null && page.searchComplete)
    : base.extend({ page: z.number().int().positive(), nextPage: z.number().int().positive().nullable() })
      .refine((page) => page.hasMore ? page.nextPage === page.page + 1 : page.nextPage === null);
}
export interface SelectorPage { items: ReferenceItem[]; pageSize: number; hasMore: boolean; page?: number; nextPage?: number | null; nextCursor?: string | null; searchComplete?: boolean }
export function referenceLabel(item: ReferenceItem, kind: SelectorKind) {
  const name = item.name?.trim() || "Unnamed reference";
  if (kind === "persons") return `${name} · ${item.secondary_label || item.employee_code || item.id.slice(-8)}`;
  return [item.parent?.name, name].filter(Boolean).join(" › ");
}
