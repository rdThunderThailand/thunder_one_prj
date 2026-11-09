import type { z } from "zod";
import { usableProfileUpload, type AssetFileKind, type FileUploadProgress, type ProfileUploadReceipt } from "../domain/asset-files-edit.ts";
import { reserveRegistrationSchema, type reservedRegistrationUploadSchema, type completedRegistrationUploadSchema } from "./asset-registration-write-contract.ts";

type Reserve = z.infer<typeof reservedRegistrationUploadSchema>;
type Complete = z.infer<typeof completedRegistrationUploadSchema>;
export interface ProfileFileUploadClient {
  reserve: (context: string, input: z.infer<typeof reserveRegistrationSchema>) => Promise<Reserve>;
  put: (file: File, url: string, mime: string, check: () => void, progress: (percent: number) => void) => Promise<{ ok: boolean }>;
  complete: (context: string, uploadId: string) => Promise<Complete>;
}
export class ProfileFileUploadError extends Error {
  code: string;
  constructor(code: string) {
    super("The selected file could not be uploaded.");
    this.code = code;
  }
}
async function uploadClient(): Promise<ProfileFileUploadClient> {
  const [client, transport] = await Promise.all([import("./asset-registration-client"), import("./registration-upload-transport")]);
  return { reserve: client.reserveRegistrationUpload, complete: client.completeRegistrationUpload, put: transport.putRegistrationUpload };
}

/** Receipts stay local to this editing session; every file gets its own submission identity, never a registration draft. */
export async function uploadProfileFile(context: string, localId: string, file: File, kind: AssetFileKind,
  receipts: Map<string, ProfileUploadReceipt>, progress: (state: FileUploadProgress) => void, check: () => void,
  client?: ProfileFileUploadClient): Promise<string> {
  check();
  let receipt = receipts.get(localId);
  if (usableProfileUpload(receipt)) {
    progress({ stage: "Verified upload reused", percent: 100 });
    return receipt!.fileId!;
  }
  if (receipt?.completed) { receipts.delete(localId); receipt = undefined; }
  receipt ??= { submissionId: crypto.randomUUID(), uploadId: crypto.randomUUID(), completed: false };
  receipts.set(localId, receipt);
  const api = client ?? await uploadClient();
  check();
  try {
    progress({ stage: "Preparing upload", percent: 0 });
    const reservation = await api.reserve(context, reserveRegistrationSchema.parse({
      upload_id: receipt.uploadId, submission_id: receipt.submissionId, purpose: kind === "photo" ? "asset_photo" : "asset_document",
      filename: file.name, mime_type: file.type, file_size_bytes: file.size,
    }));
    check();
    if (reservation.uploadId !== receipt.uploadId || receipt.fileId && receipt.fileId !== reservation.fileId) throw new ProfileFileUploadError("UPLOAD_RETRY");
    receipt = { ...receipt, fileId: reservation.fileId };
    receipts.set(localId, receipt);
    if (reservation.completed) {
      if (!reservation.expiresAt || Date.parse(reservation.expiresAt) <= Date.now()) throw new ProfileFileUploadError("UPLOAD_EXPIRED");
      receipt = { ...receipt, completed: true, expiresAt: reservation.expiresAt };
    } else {
      if (!reservation.signedUploadUrl) throw new ProfileFileUploadError("UPLOAD_RETRY");
      progress({ stage: "Uploading", percent: 0 });
      const sent = await api.put(file, reservation.signedUploadUrl, file.type, check,
        (percent) => { check(); progress({ stage: "Uploading", percent: Math.min(100, Math.max(0, Math.round(percent))) }); });
      check();
      if (!sent.ok) throw new ProfileFileUploadError("UPLOAD_RETRY");
      progress({ stage: "Verifying upload", percent: 100 });
      const completed = await api.complete(context, receipt.uploadId);
      check();
      if (completed.fileId !== reservation.fileId) throw new ProfileFileUploadError("UPLOAD_RETRY");
      if (Date.parse(completed.expiresAt) <= Date.now()) throw new ProfileFileUploadError("UPLOAD_EXPIRED");
      receipt = { ...receipt, completed: true, fileId: completed.fileId, expiresAt: completed.expiresAt };
    }
    receipts.set(localId, receipt);
    progress({ stage: "Verified upload", percent: 100 });
    return receipt.fileId!;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "UPLOAD_RETRY";
    if (code === "UPLOAD_EXPIRED" || code === "NOT_FOUND") receipts.delete(localId);
    throw error;
  }
}
