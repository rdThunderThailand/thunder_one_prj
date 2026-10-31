import { z } from "zod";

// Existing reference IDs can be PostgreSQL UUIDs without RFC version/variant bits.
// Keep the hexadecimal UUID shape check without rejecting those returned records.
const reference = z.object({ id: z.guid(), name: z.string().nullable() });
const initialCondition = z.enum(["Good", "Fair", "Damaged"]);
export const registrationOptionsSchema = z.object({
  categories: z.array(reference.extend({
    name: z.string(), is_serial_required: z.boolean(), parent_id: z.guid().nullable().optional(),
    icon_url: z.string().nullable().optional(), color_code: z.string().nullable().optional(),
  })),
  locations: z.array(reference.extend({ parent_location_id: z.guid().nullable(), location_type: z.string().nullable() })),
  persons: z.array(reference),
  orgUnits: z.array(reference.extend({ parent_department_id: z.guid().nullable() })),
  initialConditions: z.array(initialCondition).min(1),
  initialConditionsByStatus: z.object({
    Available: z.array(initialCondition).min(1), Assigned: z.array(initialCondition).min(1),
  }).optional(),
  initialStatus: z.object({
    editable: z.literal(false), withoutCustody: z.literal("Available"), withCustody: z.literal("Assigned"),
  }).optional(),
  canOverrideSerial: z.boolean(),
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

export type RegistrationOptions = z.infer<typeof registrationOptionsSchema>;
export type RegistrationReadResult =
  | { ok: true; data: RegistrationOptions }
  | { ok: false; status: number; message: string };
