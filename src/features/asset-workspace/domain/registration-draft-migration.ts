import { z } from "zod";
import { newWarranty, warrantyHasInformation } from "./registration-warranties.ts";

const legacyWarranty = z.object({
  warrantyEnabled: z.boolean(), warrantyProvider: z.string(), warrantyStart: z.string(), warrantyEnd: z.string(),
  warrantyCurrent: z.boolean(), warrantyTerms: z.string(), warrantyType: z.string(), warrantyReference: z.string(),
  warrantyYears: z.string(),
});

export function migrateRegistrationDraft(value: unknown): unknown {
  if (!value || typeof value !== "object" || !("draft" in value)) return value;
  const draft = value.draft;
  if (!draft || typeof draft !== "object" || !("warrantyEnabled" in draft)) return value;
  const parsed = legacyWarranty.safeParse(draft);
  if (!parsed.success) return value;
  const old = parsed.data;
  const warranty = {
    ...newWarranty(), provider: old.warrantyProvider, type: old.warrantyType, startDate: old.warrantyStart,
    endDate: old.warrantyEnd, reference: old.warrantyReference, coverageNote: old.warrantyTerms, isCurrent: old.warrantyCurrent,
  };
  const remaining = Object.fromEntries(Object.entries(draft).filter(([key]) => !Object.hasOwn(legacyWarranty.shape, key)));
  // Preserve excluded legacy details without silently adding an active warranty.
  return { ...value, draft: { ...remaining, warranties: old.warrantyEnabled ? [warranty] : [], savedWarranty: !old.warrantyEnabled && warrantyHasInformation(warranty) ? warranty : null } };
}
