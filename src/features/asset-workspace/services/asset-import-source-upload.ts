import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, parseImportResponse, type AssetImportApi } from "./asset-import-api.ts";
import { completedImportUploadSchema, reservedImportUploadSchema } from "./asset-import-contract.ts";
import type { ImportJsonCaller } from "./asset-import-transport.ts";
import { putRegistrationUpload } from "./registration-upload-transport.ts";

async function completeUpload(uploadId: string, fileId: string, callJson: ImportJsonCaller, checkActive?: () => void) {
  const completedData = await callJson(
    "POST",
    `/registration-uploads/${encodeURIComponent(uploadId.toLowerCase())}/complete`,
  );
  const completed = parseImportResponse(completedImportUploadSchema, completedData);
  checkActive?.();
  if (completed.fileId !== fileId) {
    throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
  }
  if (Date.parse(completed.expiresAt) <= Date.now()) {
    throw new ImportApiError("UPLOAD_EXPIRED", requestErrorText("UPLOAD_EXPIRED"), 409);
  }
  return { fileId: completed.fileId };
}

/** Reserve / original-byte PUT / complete, reusing Single Register's Storage helper. */
export async function uploadImportSource(
  input: Parameters<AssetImportApi["uploadSource"]>[0],
  callJson: ImportJsonCaller,
) {
  let reservationData: unknown;
  try {
    reservationData = await callJson("POST", "/registration-uploads", {
      upload_id: input.uploadId.toLowerCase(),
      submission_id: input.batchId.toLowerCase(),
      purpose: "import_source",
      filename: input.file.name,
      mime_type: input.mimeType,
      file_size_bytes: input.file.size,
    });
  } catch (error) {
    if (!(error instanceof ImportApiError) || error.code !== "UPLOAD_RETRY") throw error;
    // Storage will not sign a path that already holds an earlier attempt's bytes, so finish that upload.
    input.checkActive?.();
    let recovered: { fileId: string };
    try {
      recovered = await completeUpload(input.uploadId, input.uploadId.toLowerCase(), callJson, input.checkActive);
    } catch {
      input.checkActive?.();
      throw error;
    }
    input.onProgress?.(100);
    return recovered;
  }
  const reservation = parseImportResponse(reservedImportUploadSchema, reservationData);
  input.checkActive?.();
  if (reservation.uploadId !== input.uploadId.toLowerCase() || reservation.fileId !== input.uploadId.toLowerCase()) {
    throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
  }
  if (Date.parse(reservation.expiresAt) <= Date.now()) {
    throw new ImportApiError("UPLOAD_EXPIRED", requestErrorText("UPLOAD_EXPIRED"), 409);
  }
  if (reservation.completed) {
    input.onProgress?.(100);
    return { fileId: reservation.fileId };
  }

  if (!reservation.signedUploadUrl) {
    throw new ImportApiError("UPLOAD_RETRY", requestErrorText("UPLOAD_RETRY", 502), 502);
  }
  let putResponse: { ok: boolean; status: number };
  try {
    putResponse = await putRegistrationUpload(
      input.file, reservation.signedUploadUrl, input.mimeType, input.checkActive, input.onProgress,
    );
  } catch {
    throw new ImportApiError("CONNECTION_FAILED", requestErrorText("CONNECTION_FAILED"), 0);
  }
  if (!putResponse.ok) {
    throw new ImportApiError("UPLOAD_RETRY", requestErrorText("UPLOAD_RETRY", putResponse.status), putResponse.status);
  }

  input.checkActive?.();
  input.onProgress?.(100);
  return completeUpload(reservation.uploadId, reservation.fileId, callJson, input.checkActive);
}
