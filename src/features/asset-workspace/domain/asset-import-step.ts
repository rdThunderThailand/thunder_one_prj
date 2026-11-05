import type { ImportBatch } from "./asset-import-types.ts";

export type ImportStep = 0 | 1 | 2 | 3;

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
