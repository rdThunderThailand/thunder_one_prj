import { z } from "zod";

export const REGISTRATION_STEPS = ["Basic Information", "Category & Specification", "Location & Ownership", "Purchase & Warranty", "Review & Confirm"];

export const registrationDraftSchema = z.object({
  name: z.string().max(250), tagMode: z.enum(["automatic", "manual"]), assetCode: z.string().max(100),
  condition: z.enum(["Good", "Fair"]), categoryId: z.string().max(36), serialNumber: z.string().max(250),
  locationId: z.string().max(36), custodyType: z.enum(["none", "person", "org_unit"]), custodyId: z.string().max(36),
  // Preserve invalid date/period input on refresh; step validation owns calendar validity.
  purchaseDate: z.string().max(250), notes: z.string().max(5000), warrantyEnabled: z.boolean(),
  warrantyProvider: z.string().max(500), warrantyStart: z.string().max(250), warrantyYears: z.string().max(250),
  warrantyEnd: z.string().max(250), warrantyCurrent: z.boolean(), warrantyTerms: z.string().max(5000),
  warrantyType: z.string().max(250), warrantyReference: z.string().max(250),
}).strict();
export type RegistrationDraft = z.infer<typeof registrationDraftSchema>;
export const registrationStateSchema = z.object({
  draft: registrationDraftSchema, step: z.number().int().min(0).max(4), editing: z.boolean(), reviewed: z.boolean(),
}).strict().refine((state) => !state.editing || (state.reviewed && state.step < 4));
export type RegistrationState = z.infer<typeof registrationStateSchema>;

export function newRegistrationState(): RegistrationState {
  return {
    step: 0, editing: false, reviewed: false,
    draft: {
      name: "", tagMode: "automatic", assetCode: "", condition: "Good", categoryId: "", serialNumber: "",
      locationId: "", custodyType: "none", custodyId: "", purchaseDate: "", notes: "", warrantyEnabled: false,
      warrantyProvider: "", warrantyStart: "", warrantyYears: "", warrantyEnd: "", warrantyCurrent: false,
      warrantyTerms: "", warrantyType: "", warrantyReference: "",
    },
  };
}

const optionalText = (value: string) => value.trim() || undefined;

/** Only accepted API fields belong here; automatic tags are allocated by the future writer. */
export function registrationPayload(draft: RegistrationDraft) {
  return {
    name: draft.name.trim(), asset_code: draft.tagMode === "manual" ? optionalText(draft.assetCode) : undefined,
    asset_category_id: draft.categoryId, location_id: draft.locationId, condition: draft.condition,
    serial_number: optionalText(draft.serialNumber), purchase_date: draft.purchaseDate || undefined, notes: optionalText(draft.notes),
    initial_custody: draft.custodyType === "none" ? undefined : draft.custodyType === "person"
      ? { target_type: "person" as const, target_user_id: draft.custodyId }
      : { target_type: "org_unit" as const, target_org_unit_id: draft.custodyId },
    warranty: draft.warrantyEnabled ? {
      provider: draft.warrantyProvider.trim(), is_current: draft.warrantyCurrent,
      start_date: draft.warrantyStart || undefined, end_date: draft.warrantyEnd || undefined,
      warranty_type: optionalText(draft.warrantyType), reference_no: optionalText(draft.warrantyReference),
      coverage_note: optionalText(draft.warrantyTerms),
    } : undefined,
  };
}
