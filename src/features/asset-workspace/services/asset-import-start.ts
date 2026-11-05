import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ImportBatch, ParsedImportFile } from "../domain/asset-import-types.ts";
import { ImportApiError, type AssetImportApi } from "./asset-import-api.ts";

export type ImportAttempt = { batchId: string; uploadId: string };
export type ImportProgress = {
  label: string;
  value: number;
  validation?: {
    phase: "sending" | "validating" | "refreshing";
    sentRows: number;
    totalRows: number;
  };
};

function failure(code: string, status: number): ImportApiError {
  return new ImportApiError(code, requestErrorText(code, status), status);
}

/** Retry with the same attempt. Only a verified expiry permits replacing both IDs. */
export async function startImportBatch(
  api: AssetImportApi,
  attempt: ImportAttempt,
  parsed: ParsedImportFile,
  onProgress: (progress: ImportProgress) => void,
  checkActive: () => void,
): Promise<ImportBatch> {
  async function recoverBatch(): Promise<ImportBatch | null> {
    try {
      const batch = await api.getBatch(attempt.batchId);
      checkActive();
      if (batch.totalRows !== parsed.rows.length
        || (batch.sourceFile && batch.sourceFile.id !== attempt.uploadId)
        || (batch.original?.id ?? null) !== (parsed.reimport?.originalImportId ?? null)) {
        throw failure("INVALID_RESPONSE", 502);
      }
      return batch;
    } catch (error) {
      checkActive();
      if (error instanceof ImportApiError && error.status === 404 && error.code === "NOT_FOUND") return null;
      throw error;
    }
  }

  checkActive();
  onProgress({ label: "Uploading file… 0%", value: 0 });
  try {
    await api.uploadSource({
      ...attempt,
      file: parsed.file,
      // Windows can label CSV as application/vnd.ms-excel. Core needs the canonical MIME.
      mimeType: parsed.kind === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      onProgress: (value) => onProgress({ label: `Uploading file… ${Math.round(value)}%`, value }),
      checkActive,
    });
  } catch (error) {
    checkActive();
    if (!(error instanceof ImportApiError)) throw error;
    if (error.status === 409) {
      // Creating a batch links its source file. A retry then conflicts at reserve,
      // including when the earlier create/read response was lost.
      const recovered = await recoverBatch();
      if (recovered) return recovered;
      if (error.code !== "UPLOAD_EXPIRED") throw failure("UPLOAD_CONFLICT", 409);
    }
    if (error.code === "UPLOAD_EXPIRED") throw failure("UPLOAD_EXPIRED", 409);
    if (error.code === "VALIDATION" && error.status === 400) throw failure("UPLOAD_CONTENT_INVALID", 400);
    throw error;
  }

  checkActive();
  onProgress({ label: "Creating import…", value: 100 });
  try {
    await api.createBatch({
      batchId: attempt.batchId,
      sourceUploadId: attempt.uploadId,
      totalRows: parsed.rows.length,
      ...(parsed.reimport ? { originalImportId: parsed.reimport.originalImportId } : {}),
    });
  } catch (error) {
    checkActive();
    if (!(error instanceof ImportApiError)) throw error;
    if (error.code === "VALIDATION" && error.status === 400) throw failure("UPLOAD_EXPIRED", 400);
    if (error.status === 404 && parsed.reimport) throw failure("ORIGINAL_IMPORT_NOT_FOUND", 404);
    if (error.code !== "INVALID_STATE" || error.status !== 409) throw error;

    // A previous create can have committed. Recover its batch before interpreting the conflict.
    const recovered = await recoverBatch();
    if (recovered) return recovered;
    if (parsed.reimport) {
      let original: ImportBatch;
      try {
        original = await api.getBatch(parsed.reimport.originalImportId);
      } catch (originalError) {
        if (originalError instanceof ImportApiError && originalError.status === 404) {
          throw failure("ORIGINAL_IMPORT_NOT_FOUND", 404);
        }
        throw originalError;
      }
      checkActive();
      if (!["completed", "partially_completed", "failed"].includes(original.status)) {
        throw failure("ORIGINAL_IMPORT_UNFINISHED", 409);
      }
    }
    throw error;
  }
  checkActive();
  const batch = await api.getBatch(attempt.batchId);
  checkActive();
  return batch;
}
