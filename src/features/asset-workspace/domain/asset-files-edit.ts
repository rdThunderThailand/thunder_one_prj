import { z } from "zod";
import { reserveRegistrationSchema } from "../services/asset-registration-write-contract.ts";
import type { AssetFile } from "../services/asset-profile-contract.ts";

export type AssetFileKind = "photo" | "document";
export type EditableAssetFile = AssetFile & { thumbnailUrl?: string | null };
export type AssetFileSelection = { id: string; existing: EditableAssetFile | null; file: File | null; previewUrl: string | null };
export type ProfileUploadReceipt = { submissionId: string; uploadId: string; fileId?: string; expiresAt?: string; completed: boolean };
export type FileUploadProgress = { stage: string; percent: number };
export const ASSET_FILE_LIMIT = { photo: 4, document: 10 } as const;

export function existingFileSelections(files: EditableAssetFile[]): AssetFileSelection[] {
  return files.map((existing) => ({ id: existing.fileId, existing, file: null, previewUrl: null }));
}

export function validateAssetFile(file: Pick<File, "name" | "type" | "size">, kind: AssetFileKind, maxBytes: number) {
  if (!maxBytes) return "Upload rules are unavailable. Reload them before choosing files.";
  if (file.size > maxBytes) return `${file.name}: use a file no larger than ${maxBytes / 1048576} MiB.`;
  const parsed = reserveRegistrationSchema.safeParse({
    upload_id: "10000000-0000-4000-8000-000000000001", submission_id: "10000000-0000-4000-8000-000000000002",
    purpose: kind === "photo" ? "asset_photo" : "asset_document", filename: file.name, mime_type: file.type, file_size_bytes: file.size,
  });
  return parsed.success ? null : `${file.name}: choose a valid ${kind === "photo" ? "JPEG or PNG" : "PDF, JPEG or PNG"} file with a matching extension, within the upload limit.`;
}

export function assetFilesPlan(original: EditableAssetFile[], items: AssetFileSelection[], kind: AssetFileKind, reason: string) {
  const originalIds = new Set(original.map((file) => file.fileId));
  const selectedIds = new Set(items.map((item) => item.id));
  const remove = original.filter((file) => !selectedIds.has(file.fileId)).map((file) => file.fileId);
  const additions = items.filter((item) => !item.existing);
  const errors: string[] = [];
  if (items.length > ASSET_FILE_LIMIT[kind]) errors.push(`Keep at most ${ASSET_FILE_LIMIT[kind]} ${kind === "photo" ? "photos" : "documents"}.`);
  if (selectedIds.size !== items.length || items.some((item) => item.existing ? !originalIds.has(item.id) : !item.file)) errors.push("The file selection is invalid. Reload the latest files.");
  const reasonError = remove.length && !reason.trim() ? "Give a reason for removing or replacing files."
    : remove.length && reason.trim().length > 1000 ? "Keep the reason within 1000 characters." : "";
  return { remove, additions, errors, reasonError, dirty: Boolean(remove.length || additions.length),
    valid: !errors.length && !reasonError, reason: remove.length ? reason.trim() : undefined };
}

export const assetFilesChangeInputSchema = z.object({
  expectedUpdatedAt: z.iso.datetime({ offset: true }), add: z.array(z.guid()).max(10), remove: z.array(z.guid()).max(10),
  reason: z.string().trim().max(1000).optional(),
}).strict().refine((value) => value.add.length + value.remove.length > 0)
  .refine((value) => new Set([...value.add, ...value.remove]).size === value.add.length + value.remove.length)
  .refine((value) => !value.remove.length || Boolean(value.reason));
export type AssetFilesChangeInput = z.infer<typeof assetFilesChangeInputSchema>;

export function usableProfileUpload(receipt: ProfileUploadReceipt | undefined, now = Date.now()) {
  return Boolean(receipt?.completed && receipt.fileId && receipt.expiresAt && Date.parse(receipt.expiresAt) > now);
}

export function assetFilesFeedback(code: string, uncertain = false) {
  const messages: Record<string, string> = {
    STALE: "This asset changed since you opened the files. Your pending changes have been kept. Reload the latest files before saving again.",
    INVALID_STATE: "Disposed assets can't have their files changed.",
    PERMISSION_DENIED: "You don't have permission to change asset files.",
    UNAUTHENTICATED: "Your session has expired. Sign in again before changing files.",
    NOT_FOUND: "The asset or selected upload is no longer available in your organization.",
    VALIDATION: "The file changes were rejected. Check the file types, limits and required reason. Your selections have been kept.",
    UPLOAD_EXPIRED: "A selected upload expired. Save again to upload it afresh; other verified uploads will be reused.",
    UPLOAD_RETRY: "A file upload didn't finish. Save again to resume; verified uploads will be reused.",
    REGISTRATION_UPLOAD_UNAVAILABLE: "File uploads are temporarily unavailable. Your selections have been kept.",
  };
  return { code, uncertain, message: uncertain
    ? "We couldn't confirm the file save. Check the latest files before making another change. This request will not be repeated automatically."
    : messages[code] ?? "The files could not be saved. Your selections have been kept. Save again when you are ready." };
}
