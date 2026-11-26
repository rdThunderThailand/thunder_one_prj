import { z } from "zod";
import { selectedReferencesSchema } from "../services/registration-selector-contract.ts";
import { warrantyDraftSchema } from "./registration-warranties.ts";

export const REGISTRATION_STEPS = ["Basic Information", "Category & Specification", "Location & Ownership", "Acquisition & Warranty", "Review & Confirm"];

export const registrationDraftSchema = z.object({
  selectedReferences: selectedReferencesSchema.default({ categories: null, locations: null, orgUnits: null, persons: null }),
  name: z.string().max(250), tagMode: z.enum(["automatic", "manual"]), assetCode: z.string().max(100),
  // Defaults keep existing saved text drafts compatible; photo bytes never enter tab storage.
  description: z.string().max(5000).default(""), hasPhotoSelections: z.boolean().default(false),
  photoSelectionIds: z.array(z.uuid()).default([]), documentSelectionIds: z.array(z.uuid()).default([]),
  condition: z.enum(["Good", "Fair", "Damaged"]), categoryId: z.string().max(36), serialNumber: z.string().max(250),
  locationId: z.string().max(36), custodyType: z.enum(["none", "person", "org_unit"]), custodyId: z.string().max(36),
  // Invalid date text stays in the draft until field validation succeeds.
  purchaseDate: z.string().max(250), notes: z.string().max(5000),
  hasDocumentSelections: z.boolean().default(false), warranties: z.array(warrantyDraftSchema).default([]),
  savedWarranty: warrantyDraftSchema.nullable().default(null),
}).strict().refine((draft) => new Set(draft.warranties.map((warranty) => warranty.clientId)).size === draft.warranties.length);
export type RegistrationDraft = z.infer<typeof registrationDraftSchema>;
export const registrationStateSchema = z.object({
  draft: registrationDraftSchema, step: z.number().int().min(0).max(4), editing: z.boolean(), reviewed: z.boolean(),
}).strict().refine((state) => !state.editing || (state.reviewed && state.step < 4));
export type RegistrationState = z.infer<typeof registrationStateSchema>;

export function newRegistrationState(): RegistrationState {
  return {
    step: 0, editing: false, reviewed: false,
    draft: {
      selectedReferences: { categories: null, locations: null, orgUnits: null, persons: null },
      name: "", tagMode: "automatic", assetCode: "", description: "", hasPhotoSelections: false, photoSelectionIds: [], documentSelectionIds: [],
      condition: "Good", categoryId: "", serialNumber: "",
      locationId: "", custodyType: "none", custodyId: "", purchaseDate: "", notes: "",
      warranties: [], savedWarranty: null, hasDocumentSelections: false,
    },
  };
}

const optionalText = (value: string) => value.trim() || undefined;

/** Only accepted API fields belong here; automatic tags are allocated by the future writer. */
export function registrationPayload(draft: RegistrationDraft) {
  return {
    name: draft.name.trim(), asset_code: draft.tagMode === "manual" ? optionalText(draft.assetCode) : undefined,
    asset_category_id: draft.categoryId, location_id: draft.locationId, condition: draft.condition,
    serial_number: optionalText(draft.serialNumber), description: optionalText(draft.description),
    purchase_date: draft.purchaseDate || undefined, notes: optionalText(draft.notes),
    initial_custody: draft.custodyType === "none" ? undefined : draft.custodyType === "person"
      ? { target_type: "person" as const, target_user_id: draft.custodyId }
      : { target_type: "org_unit" as const, target_org_unit_id: draft.custodyId },
    warranties: draft.warranties.map((warranty) => ({
      client_id: warranty.clientId, provider: warranty.provider.trim(), is_current: warranty.isCurrent,
      start_date: warranty.startDate || undefined, end_date: warranty.endDate || undefined,
      warranty_type: optionalText(warranty.type), reference_no: optionalText(warranty.reference),
      coverage_note: optionalText(warranty.coverageNote), status: optionalText(warranty.status),
    })),
  };
}
