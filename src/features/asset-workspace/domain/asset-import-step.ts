import type { ImportBatch } from "./asset-import-types.ts";

export type ImportStep = 0 | 1 | 2 | 3;

/** After a reload, reopen Map & Validate if the user was there or nothing can be registered. */
export function restoredMappingView(batch: ImportBatch, savedMappingView?: boolean): boolean {
  return batch.status === "validated" && (savedMappingView === true || batch.counts.valid + batch.counts.warning === 0);
}

export function isFinishedImport(batch: ImportBatch): boolean {
  return ["completed", "partially_completed", "failed"].includes(batch.status);
}

export function stepFor(
  batch: ImportBatch | null,
  hasParsedFile: boolean,
): { step: ImportStep; notice?: "FILE_LOST" | "NOT_FOUND" } {
  if (!batch) return { step: 0 };

  switch (batch.status) {
    case "uploaded":
      return hasParsedFile ? { step: 1 } : { step: 0, notice: "FILE_LOST" };
    case "validated":
    case "processing":
      return { step: 2 };
    case "completed":
    case "partially_completed":
    case "failed":
      return { step: 3 };
  }
}
