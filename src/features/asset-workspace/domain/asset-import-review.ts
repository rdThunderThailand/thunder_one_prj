import type { ConfirmMode, ImportBatch } from "./asset-import-types.ts";

export function importReviewSelection(counts: ImportBatch["counts"], mode: ConfirmMode, reason: string, maxLength: number) {
  const effectiveMode = counts.warning > 0 ? mode : "ready_only";
  const warnings = effectiveMode === "ready_and_warnings" ? counts.warning : 0;
  const needsReason = warnings > 0;
  const trimmedReason = reason.trim();
  return {
    mode: effectiveMode,
    warnings,
    toRegister: counts.valid + warnings,
    needsReason,
    invalidReason: needsReason && (!trimmedReason || trimmedReason.length > maxLength),
    body: { mode: effectiveMode, ...(needsReason ? { override_reason: trimmedReason } : {}) },
  };
}

export function importConfirmProcessed(batch: ImportBatch): number {
  if (batch.status === "processing") return batch.totalRows - batch.counts.pending;
  if (["completed", "partially_completed", "failed"].includes(batch.status)) return batch.totalRows;
  return 0;
}
