import { z } from "zod";

const initialCondition = z.enum(["Good", "Fair", "Damaged"]);
export const registrationOptionsSchema = z.object({
  referenceSelectors: z.object({
    pageSize: z.number().int().positive().max(100), maxPageSize: z.number().int().positive().max(100),
    search: z.object({ enabled: z.literal(true), debounceMs: z.number().int().nonnegative(), maxLength: z.number().int().positive().max(200) }),
    categories: z.object({ path: z.string(), hierarchical: z.literal(true) }),
    locations: z.object({ path: z.string(), hierarchical: z.literal(true) }),
    orgUnits: z.object({ path: z.string(), hierarchical: z.literal(true) }),
    persons: z.object({ path: z.string(), hierarchical: z.literal(false), pagination: z.literal("cursor") }),
  }),
  initialConditions: z.array(initialCondition).min(1),
  initialConditionsByStatus: z.object({
    Available: z.array(initialCondition).min(1), Assigned: z.array(initialCondition).min(1),
  }).optional(),
  initialStatus: z.object({
    editable: z.literal(false), withoutCustody: z.literal("Available"), withCustody: z.literal("Assigned"),
  }).optional(),
  // Anyone who may register may override a duplicate serial by giving a reason (Core #262).
  serialOverride: z.object({
    field: z.literal("serial_override_reason"), maxLength: z.number().int().positive().max(1000), reasonIsConfirmation: z.literal(true),
  }),
  tagGeneration: z.object({
    modes: z.array(z.enum(["manual", "automatic"])).min(1), allocatedOn: z.literal("creation"),
    prefix: z.string().optional(), sequenceDigits: z.number().int().positive().optional(),
    format: z.string().optional(), reservesTag: z.literal(false).optional(),
  }),
  photoUpload: z.object({
    enabled: z.boolean(), maxPhotos: z.number().int().positive(), maxBytesPerPhoto: z.number().int().positive(),
    uploadOn: z.literal("confirmation"),
  }).optional(),
  documentUpload: z.object({
    required: z.literal(false), enabled: z.boolean(), reason: z.string().nullable(),
    maxAssetDocuments: z.number().int().positive(), maxDocumentsPerWarranty: z.number().int().positive(),
    maxBytesPerDocument: z.number().int().positive(), mimeTypes: z.array(z.string()).min(1), extensions: z.array(z.string()).min(1),
    uploadOn: z.literal("confirmation"),
  }).optional(),
  warranties: z.object({
    required: z.literal(false), multiple: z.literal(true), providerRequired: z.literal(true),
    currentSelection: z.object({ explicit: z.literal(true), requiredWhenPresent: z.literal(true), count: z.literal(1) }),
    fields: z.array(z.string()), typeInput: z.literal("text"), statusInput: z.literal("text"),
  }).optional(),
  uploadStorage: z.object({
    uploadEnabled: z.boolean(), cleanupEnabled: z.boolean(), uploadIdRequired: z.literal(true),
    transport: z.literal("signed_staging_then_verified_final"), temporaryTtlSeconds: z.number().int().positive(),
  }).optional(),
  submission: z.object({
    method: z.literal("POST"), path: z.string(), canSubmit: z.boolean(), reason: z.string().nullable().optional(),
    submissionIdRequired: z.literal(true).optional(), retryPolicy: z.literal("same_submission_id_and_payload").optional(),
  }),
});

export type RegistrationRules = z.infer<typeof registrationOptionsSchema>;
/** UI-only validation state; R1 never supplies or preloads reference directories. */
export type RegistrationOptions = RegistrationRules & { referenceValidation?: import("./registration-selector-contract").ReferenceValidation };
