import { z } from "zod";
import { isCalendarDate } from "../domain/registration-warranty-dates.ts";

const reference = z.guid().transform((value) => value.toLowerCase());
const date = z.string().refine(isCalendarDate);
const text = (max: number) => z.string().trim().min(1).max(max).optional();
const fileIds = z.array(reference).max(2).optional();
export const createRegistrationSchema = z.object({
  submission_id: z.uuid(), name: z.string().trim().min(1).max(250), asset_code: text(100),
  asset_category_id: reference, location_id: reference, condition: z.enum(["Good", "Fair", "Damaged"]),
  serial_number: text(250), description: text(5000), purchase_date: date.optional(), notes: text(5000),
  initial_custody: z.discriminatedUnion("target_type", [
    z.object({ target_type: z.literal("person"), target_user_id: reference }).strict(),
    z.object({ target_type: z.literal("org_unit"), target_org_unit_id: reference }).strict(),
  ]).optional(),
  warranties: z.array(z.object({
    client_id: z.uuid(), provider: z.string().trim().min(1).max(500), warranty_type: text(250),
    start_date: date.optional(), end_date: date.optional(), reference_no: text(250), coverage_note: text(5000),
    status: text(100), is_current: z.boolean(), document_file_ids: fileIds,
  }).strict()).optional(),
  photo_file_ids: fileIds, document_file_ids: fileIds,
  // The reason is the override confirmation, as asset_update_details (#257).
  serial_override_reason: z.string().trim().min(1).max(1000).optional(),
}).strict();
export type CreateRegistration = z.infer<typeof createRegistrationSchema>;

export const reserveRegistrationSchema = z.object({
  upload_id: z.uuid(), submission_id: z.uuid(), purpose: z.enum(["asset_photo", "asset_document", "warranty_document"]),
  filename: z.string().trim().min(1).max(255).refine((value) => !/[/\\\u0000-\u001f\u007f]/.test(value)),
  mime_type: z.enum(["image/jpeg", "image/png", "application/pdf"]), file_size_bytes: z.number().int().positive().max(10485760),
  warranty_client_id: z.uuid().optional(),
}).strict().refine((value) => (value.purpose === "warranty_document") === Boolean(value.warranty_client_id))
  .refine((value) => {
    const extension = /\.[^.]+$/.exec(value.filename)?.[0].toLowerCase();
    return value.mime_type === "image/jpeg" ? extension === ".jpg" || extension === ".jpeg"
      : value.mime_type === "image/png" ? extension === ".png" : value.purpose !== "asset_photo" && extension === ".pdf";
  });
export const createdRegistrationSchema = z.object({ assetId: reference, assetTag: z.string().min(1), replayed: z.boolean(), profilePath: z.string().optional() });
export const completedRegistrationUploadSchema = z.object({ fileId: reference, expiresAt: z.iso.datetime({ offset: true }) });
export const reservedRegistrationUploadSchema = z.object({
  uploadId: z.uuid(), fileId: reference, completed: z.boolean(), expiresAt: z.iso.datetime({ offset: true }).nullable(),
  signedUploadUrl: z.url().refine((value) => { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }).nullable(),
});
export type CreatedRegistration = z.infer<typeof createdRegistrationSchema>;
