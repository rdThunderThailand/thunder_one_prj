import { buildSendRows, chunk, firstTooLongCell, missingRequired } from "../domain/asset-import-mapping.ts";
import { formatCount } from "../domain/asset-import-format.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ColumnMapping, ImportOptions, ParsedImportFile, SendRow } from "../domain/asset-import-types.ts";
import { ImportApiError, type AssetImportApi } from "./asset-import-api.ts";
import type { ImportProgress } from "./asset-import-start.ts";

export type ImportValidationAttempt = {
  batchId: string;
  mapping: ColumnMapping;
  chunks: SendRow[][];
  totalRows: number;
  rowsPerRequest: number;
  nextChunk: number;
};

/** Freeze the mapped payload before the first write so every retry sends the same rows. */
export function prepareImportValidation(
  batchId: string,
  file: ParsedImportFile,
  mapping: ColumnMapping,
  options: Pick<ImportOptions, "columns" | "chunks">,
): ImportValidationAttempt {
  if (missingRequired(mapping, options.columns).length) {
    throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION"), 400);
  }
  const tooLongRow = firstTooLongCell(file, mapping);
  if (tooLongRow !== null) {
    throw new ImportApiError("CELL_TOO_LONG",
      `Row ${formatCount(tooLongRow)} has a cell longer than 5,000 characters. Shorten it and replace the file.`, 400);
  }
  const rows = buildSendRows(file, mapping);
  // Core accepts at most 1,000 rows even if an incompatible options response advertises more.
  const rowsPerRequest = Math.min(options.chunks.rowsPerRequest, 1000);
  return { batchId, mapping: [...mapping], chunks: chunk(rows, rowsPerRequest), totalRows: rows.length, rowsPerRequest, nextChunk: 0 };
}

function missingRows(error: unknown, totalRows: number): boolean {
  if (!(error instanceof ImportApiError) || error.status !== 400 || error.code !== "VALIDATION") return false;
  const details = error.details;
  return typeof details === "object" && details !== null && "expected" in details && "received" in details
    && details.expected === totalRows && typeof details.received === "number"
    && Number.isInteger(details.received) && details.received >= 0 && details.received < totalRows;
}

export async function validateImportBatch(
  api: AssetImportApi,
  attempt: ImportValidationAttempt,
  onProgress: (progress: ImportProgress) => void,
  checkActive: () => void,
) {
  function report(phase: "sending" | "validating" | "refreshing", sentRows: number, label: string) {
    onProgress({
      label,
      value: sentRows / attempt.totalRows * 100,
      validation: { phase, sentRows, totalRows: attempt.totalRows },
    });
  }

  async function sendRemainingChunks() {
    while (attempt.nextChunk < attempt.chunks.length) {
      checkActive();
      const start = attempt.nextChunk * attempt.rowsPerRequest;
      const end = Math.min(start + attempt.chunks[attempt.nextChunk].length, attempt.totalRows);
      report("sending", start,
        `Sending rows ${formatCount(start + 1)}–${formatCount(end)} of ${formatCount(attempt.totalRows)}…`);
      await api.addRows(attempt.batchId, attempt.chunks[attempt.nextChunk]);
      checkActive();
      // A lost response leaves this cursor unchanged; Core safely accepts the same chunk again.
      attempt.nextChunk += 1;
      report("sending", end, `${formatCount(end)} of ${formatCount(attempt.totalRows)} rows sent.`);
    }
  }

  await sendRemainingChunks();
  checkActive();
  report("validating", attempt.totalRows, "Checking required fields, references, and duplicates…");
  try {
    await api.validate(attempt.batchId);
  } catch (error) {
    checkActive();
    if (!missingRows(error, attempt.totalRows)) throw error;
    report("sending", 0, "Some rows were not sent. Sending them again…");
    attempt.nextChunk = 0;
    await sendRemainingChunks();
    checkActive();
    report("validating", attempt.totalRows, "Checking required fields, references, and duplicates…");
    // One recovery pass only. Other validation failures must remain visible.
    await api.validate(attempt.batchId);
  }
  checkActive();
  report("refreshing", attempt.totalRows, "Loading validation results…");
  const batch = await api.getBatch(attempt.batchId);
  checkActive();
  return batch;
}
