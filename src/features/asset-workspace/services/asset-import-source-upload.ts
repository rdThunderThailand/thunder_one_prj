import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, parseImportResponse, type AssetImportApi } from "./asset-import-api.ts";
import { completedImportUploadSchema, reservedImportUploadSchema } from "./asset-import-contract.ts";
import type { ImportJsonCaller } from "./asset-import-transport.ts";
import { putRegistrationUpload } from "./registration-upload-transport.ts";

/** Reserve / original-byte PUT / complete, reusing Single Register's Storage helper. */
export async function uploadImportSource(
  input: Parameters<AssetImportApi["uploadSource"]>[0],
  callJson: ImportJsonCaller,
) {
  input.onProgress?.(10);
  const reservationData = await callJson("POST", "/registration-uploads", {
    upload_id: input.uploadId.toLowerCase(),
    submission_id: input.batchId.toLowerCase(),
    purpose: "import_source",
    filename: input.file.name,
    mime_type: input.mimeType,
    file_size_bytes: input.file.size,
  });
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
  input.onProgress?.(40);
  let putResponse: { ok: boolean; status: number };
  try {
    putResponse = await putRegistrationUpload(input.file, reservation.signedUploadUrl, input.mimeType, input.checkActive);
  } catch {
    throw new ImportApiError("CONNECTION_FAILED", requestErrorText("CONNECTION_FAILED"), 0);
  }
  if (!putResponse.ok) {
    throw new ImportApiError("UPLOAD_RETRY", requestErrorText("UPLOAD_RETRY", putResponse.status), putResponse.status);
  }

  input.checkActive?.();
  input.onProgress?.(80);
  const completedData = await callJson(
    "POST",
    `/registration-uploads/${encodeURIComponent(reservation.uploadId.toLowerCase())}/complete`,
  );
  const completed = parseImportResponse(completedImportUploadSchema, completedData);
  input.checkActive?.();
  if (completed.fileId !== reservation.fileId) {
    throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
  }
  if (Date.parse(completed.expiresAt) <= Date.now()) {
    throw new ImportApiError("UPLOAD_EXPIRED", requestErrorText("UPLOAD_EXPIRED"), 409);
  }
  input.onProgress?.(100);
  return { fileId: completed.fileId };
}
