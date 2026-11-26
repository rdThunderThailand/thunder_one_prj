import { z } from "zod";
import type { AssetDetail } from "../services/asset-profile-contract.ts";

export type AssetEditDraft = { name: string; categoryId: string; serialNumber: string; acquisitionDate: string; notes: string };
export type AssetEditErrors = Partial<Record<keyof AssetEditDraft | "serialOverrideReason", string>>;
export type AssetEditInput = { expectedUpdatedAt: string; name?: string; categoryId?: string; serialNumber?: string | null;
  acquisitionDate?: string | null; notes?: string | null; serialOverrideReason?: string };
const optionalText = (value: string | null) => value?.trim() || null;

export function assetEditDraft(asset: AssetDetail): AssetEditDraft {
  return { name: asset.name, categoryId: asset.category?.id ?? "", serialNumber: asset.serialNumber ?? "",
    acquisitionDate: asset.acquisitionDate?.slice(0, 10) ?? "", notes: asset.notes ?? "" };
}

export function assetEditPatch(asset: AssetDetail, draft: AssetEditDraft) {
  const fields: AssetEditErrors = {};
  const input: AssetEditInput = { expectedUpdatedAt: asset.updatedAt };
  if (!draft.name.trim()) fields.name = "Enter an asset name.";
  if (!z.guid().safeParse(draft.categoryId).success) fields.categoryId = "Choose a category.";
  if (draft.acquisitionDate && !z.iso.date().safeParse(draft.acquisitionDate).success) fields.acquisitionDate = "Enter a valid acquisition date.";
  if (draft.name.trim() !== asset.name.trim()) input.name = draft.name.trim();
  if (draft.categoryId !== (asset.category?.id ?? "")) input.categoryId = draft.categoryId;
  if (optionalText(draft.serialNumber) !== optionalText(asset.serialNumber)) input.serialNumber = optionalText(draft.serialNumber);
  if ((draft.acquisitionDate || null) !== (asset.acquisitionDate?.slice(0, 10) || null)) input.acquisitionDate = draft.acquisitionDate || null;
  if (optionalText(draft.notes) !== optionalText(asset.notes)) input.notes = optionalText(draft.notes);
  return { input, fields, dirty: Object.keys(input).length > 1, valid: Object.keys(fields).length === 0 };
}

const duplicates = z.array(z.object({ id: z.guid(), assetTag: z.string(), name: z.string().nullable() }));
const validationFields = z.record(z.string(), z.array(z.string()));
const fieldLabels = { name: "asset name", categoryId: "category", serialNumber: "serial number",
  acquisitionDate: "acquisition date", notes: "notes", serialOverrideReason: "override reason" } as const;

export function assetEditWithReason(input: AssetEditInput, serial: string, rejectedSerial: string | null, reason: string) {
  const fields: AssetEditErrors = {};
  if (rejectedSerial === null || serial.trim() !== rejectedSerial) return { input, fields };
  if (!reason.trim()) {
    fields.serialOverrideReason = "Give a reason to keep the duplicate serial number.";
    return { input: null, fields };
  }
  return { input: { ...input, serialOverrideReason: reason.trim() }, fields };
}

export function assetEditFeedback(code: string, details?: unknown, uncertain = false) {
  const fields: AssetEditErrors = {};
  const parsed = duplicates.safeParse(details);
  let message = "The asset could not be saved. Your input has been kept.";
  if (code === "VALIDATION") {
    message = "Review the highlighted fields. Your input has been kept.";
    const errors = validationFields.safeParse(details);
    if (errors.success) {
      for (const key of Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]) {
        if (errors.data[key]?.length) fields[key] = `Review the ${fieldLabels[key]}.`;
      }
    }
  }
  if (code === "INVALID_CATEGORY") fields.categoryId = "Choose an active category in your organization.";
  if (code === "SERIAL_REQUIRED") fields.serialNumber = "This category requires a serial number.";
  if (code === "SERIAL_DUPLICATE") message = "This serial number is already used. Review the matching assets and give a reason to save it anyway.";
  if (code === "STALE") message = "This asset changed since you opened it. Your input has been kept. Reload to replace it with the latest details.";
  if (code === "INVALID_STATE") message = "Disposed assets can't be edited. Your input has been kept.";
  if (code === "PERMISSION_DENIED") message = "You don't have permission to edit assets.";
  if (code === "UNAUTHENTICATED") message = "Your session has expired. Sign in again before editing.";
  if (code === "NOT_FOUND") message = "This asset is no longer available in your organization.";
  if (uncertain) message = "We couldn't confirm the save. Check the latest profile before trying again; this request will not be repeated automatically.";
  return { code, message, fields, uncertain, duplicates: code === "SERIAL_DUPLICATE" && parsed.success ? parsed.data : [] };
}
