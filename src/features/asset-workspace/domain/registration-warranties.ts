import { z } from "zod";
import { isCalendarDate } from "./registration-warranty-dates.ts";

export const warrantyDraftSchema = z.object({
  clientId: z.uuid(), provider: z.string().max(500), type: z.string().max(250),
  startDate: z.string().max(250), endDate: z.string().max(250), reference: z.string().max(250),
  coverageNote: z.string().max(5000), status: z.string().max(100), isCurrent: z.boolean(),
  hasDocumentSelections: z.boolean().default(false),
  documentSelectionIds: z.array(z.uuid()).default([]),
}).strict();
export type WarrantyDraft = z.infer<typeof warrantyDraftSchema>;
export type WarrantyErrors = Partial<Record<keyof WarrantyDraft, string>>;

export function newWarranty(): WarrantyDraft {
  return { clientId: crypto.randomUUID(), provider: "", type: "", startDate: "", endDate: "", reference: "", coverageNote: "", status: "", isCurrent: false, hasDocumentSelections: false, documentSelectionIds: [] };
}

export function warrantyErrors(warranty: WarrantyDraft): WarrantyErrors {
  const errors: WarrantyErrors = {};
  if (!warranty.provider.trim()) errors.provider = "Enter the warranty provider or remove this warranty.";
  if (warranty.startDate && !isCalendarDate(warranty.startDate)) errors.startDate = "Enter a valid start date.";
  if (warranty.endDate && !isCalendarDate(warranty.endDate)) errors.endDate = "Enter a valid end date.";
  if (isCalendarDate(warranty.startDate) && isCalendarDate(warranty.endDate) && warranty.endDate < warranty.startDate) {
    errors.endDate = "Warranty end must be on or after its start date.";
  }
  for (const [field, max] of [["provider", 500], ["type", 250], ["reference", 250], ["coverageNote", 5000], ["status", 100]] as const) {
    if (warranty[field].trim().length > max) errors[field] = `Use no more than ${max} characters.`;
  }
  return errors;
}

export function warrantyHasInformation(warranty: WarrantyDraft): boolean {
  return warranty.isCurrent || warranty.hasDocumentSelections || [warranty.provider, warranty.type, warranty.startDate, warranty.endDate, warranty.reference, warranty.coverageNote, warranty.status].some((value) => value.trim());
}
