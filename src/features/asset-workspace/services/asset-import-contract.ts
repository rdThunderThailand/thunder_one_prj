import { z } from "zod";
import { completedRegistrationUploadSchema, reservedRegistrationUploadSchema } from "./asset-registration-write-contract.ts";
import {
  type ConfirmResult,
  type ImportBatch,
  type ImportRow,
  type RowMessage,
  type RowsPage,
} from "../domain/asset-import-types.ts";

import { importFieldKeySchema } from "./asset-import-options-contract.ts";

export { importColumnSchema, importOptionsSchema } from "./asset-import-options-contract.ts";

const batchStatusSchema = z.enum([
  "uploaded",
  "validated",
  "processing",
  "completed",
  "partially_completed",
  "failed",
]);

const severitySchema = z.enum(["valid", "warning", "error"]);
const rowResultSchema = z.enum(["created", "created_with_warning", "not_registered"]);

const rowCodeSchema = z.enum([
  "VALIDATION",
  "REQUIRED",
  "INVALID_DATE",
  "INVALID_CONDITION",
  "UNKNOWN_CATEGORY",
  "UNKNOWN_LOCATION",
  "UNKNOWN_ASSIGNEE",
  "AMBIGUOUS_REFERENCE",
  "SERIAL_REQUIRED",
  "SERIAL_DUPLICATE",
  "TAG_TAKEN",
  "TAG_DUPLICATE_IN_FILE",
  "ALREADY_IMPORTED",
  "UNKNOWN_SOURCE_ROW",
  "SOURCE_ROW_DUPLICATE_IN_FILE",
]);

export const rowMessageSchema: z.ZodType<RowMessage> = z.object({
  field: z.union([importFieldKeySchema, z.literal("row")]),
  code: rowCodeSchema,
  severity: z.enum(["error", "warning"]),
  message: z.string(),
  detailsTotal: z.number().int().nonnegative().optional(),
  details: z
    .union([
      z.array(
        z.object({
          id: z.uuid(),
          assetTag: z.string().nullable(),
          name: z.string(),
        }),
      ),
      z.object({
        rows: z.array(z.number().int().positive()).max(20),
        total: z.number().int().min(2),
      }),
      z.object({
        candidates: z.array(z.string()),
      }),
    ])
    .optional(),
});

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

export const importRowSchema: z.ZodType<ImportRow> = z.object({
  id: z.uuid(),
  rowIndex: z.number().int().min(1).max(1048576),
  values: z.partialRecord(importFieldKeySchema, z.string()),
  severity: severitySchema,
  messages: z.array(rowMessageSchema),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  result: rowResultSchema.nullable(),
  createdAsset: z
    .object({
      id: z.uuid(),
      assetTag: z.string().min(1),
      name: z.string(),
    })
    .nullable(),
  override: z
    .object({
      reason: z.string().nullable(),
      by: z
        .object({
          id: z.string().min(1),
          name: z.string().min(1),
        })
        .nullable(),
      at: z.string().min(1),
    })
    .nullable(),
  originalRowIndex: z.number().int().min(1).max(1048576).nullable(),
});

export const rowsPageSchema: z.ZodType<RowsPage> = z.object({
  rows: z.array(importRowSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
});

export const confirmResultSchema: z.ZodType<ConfirmResult> = z.object({
  batchId: z.uuid(),
  status: batchStatusSchema,
  processed: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  counts: z.object({
    created: z.number().int().nonnegative(),
    createdWithWarning: z.number().int().nonnegative(),
    notRegistered: z.number().int().nonnegative(),
  }),
});

export const confirmRequestSchema = z.object({
  mode: z.enum(["ready_only", "ready_and_warnings"]).optional(),
  override_reason: z.string().trim().min(1).max(1000).optional(),
}).strict();

export const createBatchResultSchema = z.object({
  batchId: z.uuid(),
  batchCode: z.string().min(1),
  status: batchStatusSchema,
  totalRows: z.number().int().positive(),
  rowsPerRequest: z.number().int().positive(),
  replayed: z.boolean(),
});

export const addRowsResultSchema = z.object({
  received: z.number().int().positive(),
  inserted: z.number().int().nonnegative(),
  alreadyPresent: z.number().int().nonnegative(),
  batch: z.object({
    status: batchStatusSchema,
    rowsStored: z.number().int().nonnegative(),
    totalRows: z.number().int().positive(),
  }),
});

export const validateResultSchema = z.object({
  batchId: z.uuid(),
  status: batchStatusSchema,
  counts: z.object({
    total: z.number().int().positive(),
    valid: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
  }),
});

export const sourceFileUrlSchema = z.object({
  url: reservedRegistrationUploadSchema.shape.signedUploadUrl.unwrap(),
  expiresAt: z.iso.datetime({ offset: true }),
  name: z.string().min(1),
});

export const reservedImportUploadSchema = reservedRegistrationUploadSchema.extend({
  fileId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
  stagingPath: z.string().min(1),
  completionPath: z.string().min(1),
});

export const completedImportUploadSchema = completedRegistrationUploadSchema;
