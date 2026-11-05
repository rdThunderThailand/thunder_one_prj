import { z } from "zod";
import { IMPORT_FIELD_KEYS, type ImportColumn, type ImportOptions } from "../domain/asset-import-types.ts";

export const importFieldKeySchema = z.enum(IMPORT_FIELD_KEYS);

export const importColumnSchema: z.ZodType<ImportColumn> = z.object({
  key: importFieldKeySchema,
  label: z.string().min(1),
  required: z.boolean(),
  maxLength: z.number().int().positive().optional(),
  format: z.string().min(1).optional(),
  accepts: z.array(z.string().min(1)).optional(),
  example: z.string(),
});

export const importOptionsSchema: z.ZodType<ImportOptions> = z.object({
  ready: z.boolean(),
  reason: z.string().nullable(),
  file: z.object({
    extensions: z.array(z.string().min(1)).min(1),
    mimeTypes: z.array(z.string().min(1)).min(1),
    maxBytes: z.number().int().positive(),
    maxRows: z.number().int().positive(),
    sourceFilePurpose: z.literal("import_source"),
  }),
  chunks: z.object({
    rowsPerRequest: z.number().int().positive(),
    confirmRowsPerRequest: z.number().int().positive(),
  }),
  columns: z.array(importColumnSchema).min(1),
  referenceMatching: z.object({
    category: z.array(z.string().min(1)),
    location: z.array(z.string().min(1)),
    locationPathSeparator: z.string().min(1),
    assignee: z.array(z.string().min(1)),
    ambiguous: z.literal("error"),
  }),
  conditions: z.array(z.string().min(1)).min(1),
  conditionsByStatus: z.object({
    Available: z.array(z.string().min(1)),
    Assigned: z.array(z.string().min(1)),
  }),
  defaultCondition: z.string().min(1),
  dateFormat: z.literal("YYYY-MM-DD"),
  tagGeneration: z.object({
    modes: z.array(z.string().min(1)),
    prefix: z.string().min(1),
    sequenceDigits: z.number().int().positive(),
    format: z.string().min(1),
    allocatedOn: z.string().min(1),
    reservesTag: z.boolean(),
  }),
  serialOverride: z.object({
    field: z.string().min(1),
    maxLength: z.number().int().positive(),
    reasonIsConfirmation: z.boolean(),
  }),
  referenceSelectors: z.object({
    categories: z.string().min(1),
    locations: z.string().min(1),
    orgUnits: z.string().min(1),
    persons: z.string().min(1),
  }),
  registeredAssetsPath: z.string().min(1),
});
