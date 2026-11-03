import type { RegistrationOptions } from "../services/asset-registration-contract";
import type { RegistrationDraft } from "./registration-draft";
import { validReceipt, type UploadReceipt } from "./registration-confirmation";

/** Only unfinished selected uploads need current upload capabilities. Original-request recovery bypasses this check. */
export function registrationCreationBlocker(draft: RegistrationDraft, options: RegistrationOptions, receipts: UploadReceipt[]) {
  if (!options.submission.canSubmit) return "Asset creation is temporarily unavailable. Your registration remains in this tab.";
  const needsUpload = (ids: string[], purpose: UploadReceipt["purpose"], warrantyClientId?: string) => ids.some((id) =>
    !receipts.some((receipt) => receipt.localId === id && receipt.purpose === purpose
      && receipt.warrantyClientId === warrantyClientId && validReceipt(receipt)));
  if (needsUpload(draft.photoSelectionIds, "asset_photo") && (!options.uploadStorage?.uploadEnabled || !options.photoUpload?.enabled)) {
    return "Photo uploads are temporarily unavailable. Keep your selections and refresh availability before creating the asset.";
  }
  const documentsPending = needsUpload(draft.documentSelectionIds, "asset_document")
    || draft.warranties.some((warranty) => needsUpload(warranty.documentSelectionIds, "warranty_document", warranty.clientId));
  if (documentsPending && (!options.uploadStorage?.uploadEnabled || !options.documentUpload?.enabled)) {
    return "Document uploads are temporarily unavailable. Keep your selections and refresh availability before creating the asset.";
  }
  return "";
}
