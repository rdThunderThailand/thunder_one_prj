import { selectedFileIds, validReceipt, type ConfirmationRecord, type UploadCandidate, type UploadReceipt } from "../domain/registration-confirmation";
import type { RegistrationOptions } from "./asset-registration-contract";
import { completeRegistrationUpload, reserveRegistrationUpload, RegistrationRequestError } from "./asset-registration-client";
import { reserveRegistrationSchema } from "./asset-registration-write-contract";

async function fingerprint(file: File) {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Upload IDs and verified receipts are persisted before progressing. Signed URLs stay in memory. */
export async function uploadRegistrationFiles(context: string, initial: ConfirmationRecord, candidates: UploadCandidate[], options: RegistrationOptions,
  persist: (record: ConfirmationRecord) => void, progress: (message: string) => void, checkActive: () => void = () => {}) {
  let record = initial;
  const used = new Set<string>();
  const selected = new Set(selectedFileIds(initial.draft));
  for (const candidate of candidates) {
    checkActive();
    const { file } = candidate;
    progress(`Preparing ${file.name}`);
    const hash = await fingerprint(file);
    checkActive();
    const matches = (item: UploadReceipt) => item.purpose === candidate.purpose && item.warrantyClientId === candidate.warrantyClientId
      && item.filename === file.name && item.size === file.size && item.mimeType === file.type && item.fingerprint === hash;
    let receipt = record.uploads.find((item) => !item.unusable && item.localId === candidate.localId && matches(item));
    receipt ??= record.uploads.find((item) => !item.unusable && !selected.has(item.localId) && !used.has(item.uploadId) && matches(item) && (!item.completed || validReceipt(item)));
    if (receipt?.completed && !validReceipt(receipt)) receipt = undefined;
    if (!receipt) receipt = {
      localId: candidate.localId, uploadId: crypto.randomUUID(), purpose: candidate.purpose, warrantyClientId: candidate.warrantyClientId,
      filename: file.name, mimeType: file.type, size: file.size, fingerprint: hash, completed: false,
    };
    receipt = { ...receipt, localId: candidate.localId };
    used.add(receipt.uploadId);
    const update = (next: UploadReceipt) => {
      checkActive();
      receipt = next;
      record = { ...record, uploads: [...record.uploads.filter((item) => item.uploadId !== next.uploadId && item.localId !== next.localId), next] };
      persist(record);
    };
    update(receipt);
    if (validReceipt(receipt)) { progress(`Verified ${file.name}`); continue; }
    const enabled = candidate.purpose === "asset_photo" ? options.photoUpload?.enabled : options.documentUpload?.enabled;
    if (!options.uploadStorage?.uploadEnabled || !enabled) throw new Error("File uploads are temporarily unavailable. Your selections have been kept.");
    try {
      const reservation = await reserveRegistrationUpload(context, reserveRegistrationSchema.parse({
        upload_id: receipt.uploadId, submission_id: record.submissionId, purpose: candidate.purpose,
        filename: file.name, mime_type: file.type, file_size_bytes: file.size, warranty_client_id: candidate.warrantyClientId,
      }));
      checkActive();
      if (reservation.uploadId !== receipt.uploadId) throw new Error("The upload reservation could not be verified.");
      if (reservation.completed) {
        if (!reservation.expiresAt || Date.parse(reservation.expiresAt) <= Date.now()) {
          update({ ...receipt, unusable: true });
          throw new Error("This upload expired. Retry to upload the selected file again.");
        }
        update({ ...receipt, fileId: reservation.fileId, completed: true, expiresAt: reservation.expiresAt });
        continue;
      }
      if (!reservation.signedUploadUrl) throw new Error("The upload URL is unavailable. Try again.");
      progress(`Uploading ${file.name}`);
      const response = await fetch(reservation.signedUploadUrl, {
        method: "PUT", body: file, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
        headers: { "Content-Type": file.type, "x-upsert": "false" }, signal: AbortSignal.timeout(120000),
      });
      checkActive();
      // An existing staging object can be verified by completion. Other failures must stay failures.
      let stagingExists = response.status === 409;
      if (!response.ok && response.status === 400) {
        const body: unknown = await response.json().catch(() => null);
        stagingExists = typeof body === "object" && body !== null && "error" in body && body.error === "Duplicate";
      }
      if (!response.ok && !stagingExists) throw new Error(`Upload failed for ${file.name}. Retry to resume confirmation.`);
      checkActive();
      progress(`Verifying ${file.name}`);
      const completed = await completeRegistrationUpload(context, receipt.uploadId);
      checkActive();
      if (completed.fileId !== reservation.fileId || Date.parse(completed.expiresAt) <= Date.now()) throw new Error("The uploaded file receipt could not be verified.");
      update({ ...receipt, ...completed, completed: true });
      progress(`Verified ${file.name}`);
    } catch (failure) {
      if (failure instanceof RegistrationRequestError && ["UPLOAD_EXPIRED", "UPLOAD_NOT_FOUND"].includes(failure.code)) update({ ...receipt, unusable: true });
      throw failure;
    }
  }
  return record;
}
