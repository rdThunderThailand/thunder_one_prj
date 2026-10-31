import { z } from "zod";
import { registrationDraftSchema, registrationPayload, type RegistrationDraft } from "./registration-draft";
import { createRegistrationSchema, createdRegistrationSchema } from "../services/asset-registration-write-contract";

export const uploadReceiptSchema = z.object({
  localId: z.uuid(), uploadId: z.uuid(), purpose: z.enum(["asset_photo", "asset_document", "warranty_document"]),
  warrantyClientId: z.uuid().optional(), filename: z.string(), mimeType: z.string(), size: z.number(), fingerprint: z.string(),
  fileId: z.guid().optional(), expiresAt: z.string().optional(), completed: z.boolean(), unusable: z.boolean().optional(),
}).strict();
export type UploadReceipt = z.infer<typeof uploadReceiptSchema>;
export const confirmationSchema = z.object({
  version: z.literal(1), submissionId: z.uuid(),
  phase: z.enum(["preparing", "uploading", "submitting", "uncertain", "rejected", "succeeded"]),
  draft: registrationDraftSchema, uploads: z.array(uploadReceiptSchema), requestJson: z.string().nullable(),
  result: createdRegistrationSchema.optional(), rejectedSerial: z.string().optional(),
}).strict().superRefine((record, context) => {
  if (["submitting", "uncertain"].includes(record.phase) && !record.requestJson) context.addIssue({ code: "custom", message: "Missing original request" });
  if (record.phase === "succeeded" && !record.result) context.addIssue({ code: "custom", message: "Missing receipt" });
  if (record.requestJson) {
    try {
      const payload = createRegistrationSchema.parse(JSON.parse(record.requestJson));
      if (payload.submission_id !== record.submissionId) throw new Error("Identity mismatch");
    } catch { context.addIssue({ code: "custom", message: "Invalid original request" }); }
  }
});
export type ConfirmationRecord = z.infer<typeof confirmationSchema>;
export interface UploadCandidate { localId: string; file: File; purpose: UploadReceipt["purpose"]; warrantyClientId?: string }

export function selectedFileIds(draft: RegistrationDraft) {
  return [...draft.photoSelectionIds, ...draft.documentSelectionIds, ...draft.warranties.flatMap((warranty) => warranty.documentSelectionIds)];
}
export function validReceipt(receipt: UploadReceipt) {
  return !receipt.unusable && receipt.completed && Boolean(receipt.fileId) && Boolean(receipt.expiresAt) && Date.parse(receipt.expiresAt!) > Date.now();
}
export function missingRegistrationFiles(draft: RegistrationDraft, candidates: UploadCandidate[], receipts: UploadReceipt[]) {
  const legacy = (draft.hasPhotoSelections && !draft.photoSelectionIds.length) || (draft.hasDocumentSelections && !draft.documentSelectionIds.length)
    || draft.warranties.some((warranty) => warranty.hasDocumentSelections && !warranty.documentSelectionIds.length);
  return legacy || selectedFileIds(draft).some((id) => !candidates.some((file) => file.localId === id)
    && !receipts.some((receipt) => receipt.localId === id && validReceipt(receipt)));
}
export function confirmationPayload(draft: RegistrationDraft, record: ConfirmationRecord, overrideReason?: string) {
  const ids = (selected: string[]) => selected.map((id) => {
    const receipt = record.uploads.find((item) => item.localId === id && validReceipt(item));
    if (!receipt?.fileId) throw new Error("A selected file has not been verified or has expired. Reselect it before confirming.");
    return receipt.fileId;
  });
  const base = registrationPayload(draft);
  const payload = createRegistrationSchema.parse({
    ...base, submission_id: record.submissionId,
    photo_file_ids: ids(draft.photoSelectionIds), document_file_ids: ids(draft.documentSelectionIds),
    warranties: base.warranties.map((warranty, index) => ({ ...warranty, document_file_ids: ids(draft.warranties[index].documentSelectionIds) })),
    ...(overrideReason ? { serial_override: { confirmed: true, reason: overrideReason } } : {}),
  });
  const allIds = [...payload.photo_file_ids!, ...payload.document_file_ids!, ...payload.warranties!.flatMap((warranty) => warranty.document_file_ids!)];
  if (new Set(allIds).size !== allIds.length) throw new Error("A file cannot be attached more than once.");
  return JSON.stringify(payload);
}
