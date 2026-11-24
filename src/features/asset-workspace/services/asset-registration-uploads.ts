import { selectedFileIds, validReceipt, type ConfirmationRecord, type UploadCandidate, type UploadReceipt } from "../domain/registration-confirmation";
import type { RegistrationOptions } from "./asset-registration-contract";
import { completeRegistrationUpload, reserveRegistrationUpload, RegistrationRequestError } from "./asset-registration-client";
import { reserveRegistrationSchema } from "./asset-registration-write-contract";
import { putRegistrationUpload } from "./registration-upload-transport";

async function fingerprint(file: File) {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The popup offers Retry for this code. */
const uploadRetry = (message: string) => new RegistrationRequestError(message, "UPLOAD_RETRY");

const PARALLEL_UPLOADS = 3;

/** Upload IDs and verified receipts are persisted before progressing. Signed URLs stay in memory.
 *  Files are reserved one by one, because photos are ordered by reservation time; then up to three are sent and verified
 *  together. After a failure nothing new starts and the running files finish, so Retry only repeats what is missing. */
export async function uploadRegistrationFiles(context: string, initial: ConfirmationRecord, candidates: UploadCandidate[], options: RegistrationOptions,
  persist: (record: ConfirmationRecord) => void, progress: (message: string, activeUploads: string[]) => void, checkRun: () => void = () => {}) {
  let record = initial;
  let storageFailure: unknown;
  const used = new Set<string>();
  const selected = new Set(selectedFileIds(initial.draft));
  const active = new Set<string>();
  const running = new Set<Promise<void>>();
  const failures: unknown[] = [];
  const report = (message: string) => progress(message, [...active]);
  const checkActive = () => {
    checkRun();
    if (storageFailure) throw storageFailure;
  };
  const update = (next: UploadReceipt) => {
    checkActive();
    const others = record.uploads.filter((item) => item.uploadId === next.uploadId || item.localId !== next.localId);
    // A finished file keeps its place in the progress list.
    record = { ...record, uploads: others.some((item) => item.uploadId === next.uploadId)
      ? others.map((item) => (item.uploadId === next.uploadId ? next : item)) : [...others, next] };
    try { persist(record); }
    catch (failure) { storageFailure = failure; throw failure; }
  };
  const track = async (receipt: UploadReceipt, work: () => Promise<void>) => {
    try { await work(); }
    catch (failure) {
      if (failure instanceof RegistrationRequestError && ["UPLOAD_EXPIRED", "NOT_FOUND"].includes(failure.code)) update({ ...receipt, unusable: true });
      throw failure;
    }
  };

  async function start(candidate: UploadCandidate) {
    checkActive();
    const { file } = candidate;
    report(`Preparing ${file.name}`);
    const hash = await fingerprint(file);
    checkActive();
    const matches = (item: UploadReceipt) => item.purpose === candidate.purpose && item.warrantyClientId === candidate.warrantyClientId
      && item.filename === file.name && item.size === file.size && item.mimeType === file.type && item.fingerprint === hash;
    let found = record.uploads.find((item) => !item.unusable && item.localId === candidate.localId && matches(item));
    found ??= record.uploads.find((item) => !item.unusable && !selected.has(item.localId) && !used.has(item.uploadId) && matches(item) && (!item.completed || validReceipt(item)));
    if (found?.completed && !validReceipt(found)) found = undefined;
    const receipt: UploadReceipt = found ? { ...found, localId: candidate.localId } : {
      localId: candidate.localId, uploadId: crypto.randomUUID(), purpose: candidate.purpose, warrantyClientId: candidate.warrantyClientId,
      filename: file.name, mimeType: file.type, size: file.size, fingerprint: hash, completed: false,
    };
    used.add(receipt.uploadId);
    update(receipt);
    if (validReceipt(receipt)) { report(`Verified ${file.name}`); return; }
    const enabled = candidate.purpose === "asset_photo" ? options.photoUpload?.enabled : options.documentUpload?.enabled;
    if (!options.uploadStorage?.uploadEnabled || !enabled) throw new Error("File uploads are temporarily unavailable. Your selections have been kept.");
    active.add(receipt.uploadId);
    report(`Preparing ${file.name}`);
    await track(receipt, async () => {
      const reservation = await reserveRegistrationUpload(context, reserveRegistrationSchema.parse({
        upload_id: receipt.uploadId, submission_id: record.submissionId, purpose: candidate.purpose,
        filename: file.name, mime_type: file.type, file_size_bytes: file.size, warranty_client_id: candidate.warrantyClientId,
      }));
      checkActive();
      if (reservation.uploadId !== receipt.uploadId) throw new Error("The upload reservation could not be verified.");
      if (reservation.completed) {
        if (!reservation.expiresAt || Date.parse(reservation.expiresAt) <= Date.now()) {
          update({ ...receipt, unusable: true });
          throw uploadRetry("This upload expired. Retry to upload the selected file again.");
        }
        update({ ...receipt, fileId: reservation.fileId, completed: true, expiresAt: reservation.expiresAt });
        active.delete(receipt.uploadId);
        return;
      }
      const { signedUploadUrl, fileId } = reservation;
      if (!signedUploadUrl) throw uploadRetry("The upload URL is unavailable. Try again.");
      const task: Promise<void> = track(receipt, () => finish(file, receipt, signedUploadUrl, fileId))
        .catch((failure: unknown) => { failures.push(failure); })
        .finally(() => { running.delete(task); active.delete(receipt.uploadId); });
      running.add(task);
    });
  }

  async function finish(file: File, receipt: UploadReceipt, signedUploadUrl: string, fileId: string) {
    report(`Uploading ${file.name}`);
    const response = await putRegistrationUpload(file, signedUploadUrl, file.type, checkActive).catch(() => null);
    checkActive();
    if (!response?.ok) throw uploadRetry(`Upload failed for ${file.name}. Retry to resume confirmation.`);
    report(`Verifying ${file.name}`);
    const completed = await completeRegistrationUpload(context, receipt.uploadId);
    checkActive();
    if (completed.fileId !== fileId || Date.parse(completed.expiresAt) <= Date.now()) throw new Error("The uploaded file receipt could not be verified.");
    update({ ...receipt, ...completed, completed: true });
    active.delete(receipt.uploadId);
    report(`Verified ${file.name}`);
  }

  for (const candidate of candidates) {
    if (running.size >= PARALLEL_UPLOADS) await Promise.race(running);
    if (failures.length) break;
    try { await start(candidate); }
    catch (failure) { failures.push(failure); }
  }
  await Promise.all(running);
  if (failures.length) throw failures[0];
  return record;
}
