import { z } from "zod";
import { completedRegistrationUploadSchema, reservedRegistrationUploadSchema } from "./asset-registration-write-contract.ts";
import type { ImportBatch } from "../domain/asset-import-types.ts";

export { importColumnSchema, importOptionsSchema } from "./asset-import-options-contract.ts";

const batchStatusSchema = z.enum([
  "uploaded",
  "validated",
  "processing",
  "completed",
  "partially_completed",
  "failed",
]);

export const importBatchSchema: z.ZodType<ImportBatch> = z.object({
  id: z.uuid(),
  batchCode: z.string().min(1),
  status: batchStatusSchema,
  createdAt: z.string().min(1),
  createdBy: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  sourceFile: z
    .object({
      id: z.uuid(),
      name: z.string().min(1),
      sizeBytes: z.number().int().nonnegative(),
      mimeType: z.string().min(1),
    })
    .nullable(),
  totalRows: z.number().int().positive(),
  counts: z.object({
    valid: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
    created: z.number().int().nonnegative(),
    createdWithWarning: z.number().int().nonnegative(),
    notRegistered: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
  }),
  original: z
    .object({
      id: z.uuid(),
      batchCode: z.string().min(1),
    })
    .nullable(),
  registeredAssetsPath: z.string().min(1),
}).superRefine((batch, context) => {
  if (!["completed", "partially_completed", "failed"].includes(batch.status)) return;
  const created = batch.counts.created + batch.counts.createdWithWarning;
  const valid = created + batch.counts.notRegistered === batch.totalRows && batch.counts.pending === 0
    && (batch.status === "completed" ? batch.counts.notRegistered === 0
      : batch.status === "failed" ? created === 0 : created > 0 && batch.counts.notRegistered > 0);
  if (!valid) context.addIssue({ code: "custom", message: "The final import counts do not match its status and total." });
});

export const createBatchResultSchema = z.object({
  batchId: z.uuid(),
  batchCode: z.string().min(1),
  status: batchStatusSchema,
  totalRows: z.number().int().positive(),
  rowsPerRequest: z.number().int().positive(),
  replayed: z.boolean(),
});

export const reservedImportUploadSchema = reservedRegistrationUploadSchema.extend({
  fileId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
  stagingPath: z.string().min(1),
  completionPath: z.string().min(1),
});

export const completedImportUploadSchema = completedRegistrationUploadSchema;
