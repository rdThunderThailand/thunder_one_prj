import { z } from "zod";

// Core v2 Asset Profile contract after PR #327. Missing new fields are a contract error.
const reference = z.object({ id: z.string(), name: z.string().nullable() });
const date = z.string().nullable();

export const assetDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetTag: z.string(),
  serialNumber: z.string().nullable(),
  category: reference.nullable(),
  categoryPath: z.array(reference),
  qrValue: z.string().nullable(),
  location: reference.nullable(),
  // Root first, ending with the asset's own location.
  locationPath: z.array(z.object({ id: z.string(), name: z.string().nullable() })).default([]),
  custody: reference.extend({
    type: z.enum(["person", "org_unit"]), since: z.string().nullable().default(null),
    avatarUrl: z.string().nullable(), department: reference.nullable(),
    note: z.string().nullable().default(null),
  }).nullable(),
  // Legacy values must remain visible without guessing their canonical meaning.
  lifecycleStatus: z.string(),
  condition: z.string().nullable(),
  acquisitionDate: date,
  registrationDate: z.string(),
  updatedAt: z.string(),
  description: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  currentWarranty: z.object({
    id: z.string(), provider: z.string().nullable(), type: date, startDate: date, endDate: date,
    referenceNo: date, coverageNote: date, status: date,
    expiryStatus: z.enum(["Active", "Expiring Soon", "Expired"]),
  }).nullable().default(null),
});
export type AssetDetail = z.infer<typeof assetDetailSchema>;

const file = z.object({
  fileId: z.string(), filename: z.string(), mimeType: z.string(), sizeBytes: z.number().int().nonnegative(),
  uploadedAt: z.string(),
  // Signed for one hour; null when Storage could not sign the file.
  url: z.string().nullable(),
  // BE 02 (2026-11-12): null when no uploader was recorded or the user no longer exists.
  uploadedBy: reference.nullable().default(null),
});
export const assetFilesSchema = z.object({
  photos: z.array(file.extend({ thumbnailUrl: z.string().nullable() })),
  documents: z.array(file),
  warrantyDocuments: z.array(file.extend({ warrantyId: z.string() })),
  expiresAt: z.string(),
});
export type AssetFiles = z.infer<typeof assetFilesSchema>;
export type AssetFile = AssetFiles["documents"][number];

export const assetWarrantiesSchema = z.array(z.object({
  id: z.string(), provider: z.string().nullable(), type: date, startDate: date, endDate: date,
  referenceNo: date, coverageNote: date, status: date, isCurrent: z.boolean(), createdAt: z.string(),
}));
export type AssetWarranty = z.infer<typeof assetWarrantiesSchema>[number];

const historyText = z.string().nullable();
/** BE 03 `GET …/history`: one row per event; `from` / `to` are null when the event did not record them. */
export const assetHistoryPageSchema = z.object({
  data: z.array(z.object({
    id: z.string(), at: z.string(), eventType: z.string(), action: z.string(), summary: historyText,
    from: historyText, to: historyText, reason: historyText, actorName: historyText,
  })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type AssetHistoryPage = z.infer<typeof assetHistoryPageSchema>;
export type AssetHistoryEvent = AssetHistoryPage["data"][number];

const optionalText = z.string().nullable();
export const assetStatusHistoryPageSchema = z.object({
  data: z.array(z.object({
    id: z.string(), at: z.string(), action: optionalText, fromStatus: optionalText, toStatus: optionalText,
    fromCondition: optionalText, toCondition: optionalText, reason: optionalText, notes: optionalText, actorName: optionalText,
  })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type AssetStatusHistoryPage = z.infer<typeof assetStatusHistoryPageSchema>;
export type AssetStatusChange = AssetStatusHistoryPage["data"][number];
