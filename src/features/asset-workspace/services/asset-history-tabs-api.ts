import { z } from "zod";
import { readProfile, type ProfileReadResult } from "./asset-profile-api";

const text = z.string().nullable();
const page = {
  page: z.number().int().positive(),
  pageSize: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  actors: z.array(z.object({ id: z.string(), name: z.string() })),
};

export const FILE_HISTORY_TYPES = [
  { id: "pdf", label: "PDF" }, { id: "image", label: "Image" }, { id: "document", label: "Document" }, { id: "other", label: "Other" },
] as const;
export const FILE_HISTORY_ACTIONS = [{ id: "uploaded", label: "Uploaded" }, { id: "removed", label: "Removed" }] as const;

/** BE 04 `GET …/file-history`: attachment uploads and removals; `url` is null for a deleted file. */
export const assetFileHistorySchema = z.object({
  data: z.array(z.object({
    id: z.string(), at: z.string(), action: z.enum(["uploaded", "removed"]), fileId: text, fileName: text,
    mimeType: text, fileType: z.enum(["pdf", "image", "document", "other"]).nullable(), sizeBytes: z.number().nullable(),
    context: z.enum(["warranty", "asset_photo", "asset_document", "registration"]), warrantyId: text, reason: text,
    actorName: text, url: text, thumbnailUrl: text,
  })),
  ...page,
  expiresAt: text,
});
export type AssetFileHistoryPage = z.infer<typeof assetFileHistorySchema>;
export type AssetFileHistoryRow = AssetFileHistoryPage["data"][number];

export const AUDIT_ACTIONS = [
  "create", "update", "assign", "transfer", "return", "move", "status", "file_add", "file_remove",
  "warranty_add", "warranty_update", "warranty_current",
] as const;

/** BE 05 `GET …/audit-log`: one row per audit event with its field changes as display values. Manager or above. */
export const assetAuditLogSchema = z.object({
  data: z.array(z.object({
    id: z.string(), at: z.string(), action: z.enum([...AUDIT_ACTIONS, "other"]), eventAction: z.string(), summary: text,
    changes: z.array(z.object({ field: z.string(), before: text, after: text })), reason: text, actorName: text,
    source: z.enum(["web", "system"]),
  })),
  ...page,
});
export type AssetAuditLogPage = z.infer<typeof assetAuditLogSchema>;
export type AssetAuditEvent = AssetAuditLogPage["data"][number];

export const HISTORY_TABS_PAGE_SIZE = 20;
const path = (assetId: string, view: string, params: Record<string, string | null>) => {
  const search = new URLSearchParams({ pageSize: String(HISTORY_TABS_PAGE_SIZE) });
  for (const [key, value] of Object.entries(params)) if (value?.trim()) search.set(key, value.trim());
  return `/${encodeURIComponent(assetId)}/${view}?${search}`;
};

export type FileHistoryQuery = { page: number; q: string; fileType: string | null; action: string | null; actorId: string | null };
export function getAssetFileHistory(context: string, assetId: string, query: FileHistoryQuery, signal: AbortSignal): Promise<ProfileReadResult<AssetFileHistoryPage>> {
  return readProfile(context, path(assetId, "file-history", { ...query, page: String(query.page) }), assetFileHistorySchema, signal);
}

export type AuditLogQuery = { page: number; q: string; action: string | null; actorId: string | null; dateFrom: string | null; dateTo: string | null };
export function getAssetAuditLog(context: string, assetId: string, query: AuditLogQuery, signal: AbortSignal): Promise<ProfileReadResult<AssetAuditLogPage>> {
  return readProfile(context, path(assetId, "audit-log", { ...query, page: String(query.page) }), assetAuditLogSchema, signal);
}
