import type { UploadCandidate } from "./registration-confirmation";
import type { RegistrationDraft } from "./registration-draft";
import type { RegistrationOptions } from "../services/asset-registration-contract";

export function selectedLocalFiles(draft: RegistrationDraft): { id: string; purpose: UploadCandidate["purpose"]; target?: string }[] {
  return [
    ...draft.photoSelectionIds.map((id) => ({ id, purpose: "asset_photo" as const })),
    ...draft.documentSelectionIds.map((id) => ({ id, purpose: "asset_document" as const })),
    ...draft.warranties.flatMap((warranty) => warranty.documentSelectionIds.map((id) => ({ id, purpose: "warranty_document" as const, target: warranty.clientId }))),
  ];
}

/** Cached metadata is not authorization or a substitute for current R1 file limits. */
export function restorableRegistrationFiles(files: UploadCandidate[], draft: RegistrationDraft, options: RegistrationOptions) {
  const counts = new Map<string, number>();
  const extensions: Record<string, string[]> = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "application/pdf": [".pdf"] };
  return selectedLocalFiles(draft).flatMap((selection) => {
    const item = files.find((candidate) => candidate.localId === selection.id && candidate.purpose === selection.purpose && candidate.warrantyClientId === selection.target);
    if (!item) return [];
    const { file, purpose, warrantyClientId } = item;
    const photo = purpose === "asset_photo";
    const rules = photo ? options.photoUpload : options.documentUpload;
    if (!rules) return [];
    const limit = photo ? options.photoUpload!.maxPhotos : warrantyClientId ? options.documentUpload!.maxDocumentsPerWarranty : options.documentUpload!.maxAssetDocuments;
    const maxBytes = photo ? options.photoUpload!.maxBytesPerPhoto : options.documentUpload!.maxBytesPerDocument;
    const extension = /\.[^.]+$/.exec(file.name)?.[0].toLowerCase() ?? "";
    const group = photo ? "photos" : warrantyClientId ?? "asset";
    if (!file.name.trim() || file.name.length > 255 || /[/\\\u0000-\u001f\u007f]/.test(file.name) || !file.size || file.size > maxBytes) return [];
    if (!extensions[file.type]?.includes(extension) || photo && !file.type.startsWith("image/")) return [];
    if (!photo && (!options.documentUpload!.mimeTypes.includes(file.type) || !options.documentUpload!.extensions.includes(extension))) return [];
    if ((counts.get(group) ?? 0) >= limit) return [];
    counts.set(group, (counts.get(group) ?? 0) + 1);
    return [item];
  });
}
