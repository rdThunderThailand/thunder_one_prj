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

export const assetActivityPageSchema = z.object({
  data: z.array(z.object({
    id: z.string(), kind: z.enum(["registered", "details_edited", "photos_updated", "documents_updated", "other"]),
    summary: z.string().nullable(), reason: z.string().nullable(),
    actorName: z.string().nullable(), at: z.string(),
    events: z.array(z.object({
      id: z.string(), action: z.string(), summary: z.string().nullable(), reason: z.string().nullable(),
      file: z.object({
        fileId: z.string(), kind: z.enum(["photo", "document"]).nullable(), filename: z.string(), mimeType: z.string(),
        url: z.string().nullable(), thumbnailUrl: z.string().nullable(),
      }).nullable(),
    })),
  })),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  expiresAt: z.string(),
});
export type AssetActivityPage = z.infer<typeof assetActivityPageSchema>;
export type AssetActivityEntry = AssetActivityPage["data"][number];
