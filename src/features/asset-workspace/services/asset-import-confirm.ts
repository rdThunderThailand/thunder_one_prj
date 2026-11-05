import { formatCount } from "../domain/asset-import-format.ts";
import { importConfirmProcessed } from "../domain/asset-import-review.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ImportConfirmBody, ImportBatch } from "../domain/asset-import-types.ts";
import { ImportApiError, type AssetImportApi } from "./asset-import-api.ts";
import type { ImportProgress } from "./asset-import-start.ts";

type ConfirmState = { batch: ImportBatch; progress: ImportProgress; retrying: boolean };
const finished = (batch: ImportBatch) => ["completed", "partially_completed", "failed"].includes(batch.status);

export function waitForImportRetry(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** Only verified Core state advances the wizard. Retries read status before sending another POST. */
export async function confirmImportBatch(
  api: AssetImportApi,
  initial: ImportBatch,
  first: ImportConfirmBody | undefined,
  signal: AbortSignal,
  onState: (state: ConfirmState) => void,
  wait: (milliseconds: number, signal: AbortSignal) => Promise<void> = waitForImportRetry,
): Promise<ImportBatch> {
  let batch = initial;
  const body = Object.freeze({ ...first });
  let failures = 0;
  let refreshBeforeRetry = false;
  const publish = (retrying: boolean) => {
    signal.throwIfAborted();
    const processed = importConfirmProcessed(batch);
    onState({ batch, retrying, progress: {
      label: `Registering assets… ${formatCount(processed)} of ${formatCount(batch.totalRows)}`,
      value: processed / batch.totalRows * 100,
    } });
  };
  publish(false);
  if (finished(batch)) return batch;
  for (;;) {
    signal.throwIfAborted();
    try {
      if (refreshBeforeRetry) {
        batch = await api.getBatch(batch.id);
        publish(false);
        if (finished(batch)) return batch;
        refreshBeforeRetry = false;
      }
      const previousRemaining = batch.status === "processing" ? batch.counts.pending : batch.totalRows;
      const result = await api.confirm(batch.id, body);
      signal.throwIfAborted();
      const processedTotal = result.counts.created + result.counts.createdWithWarning + result.counts.notRegistered;
      if (result.remaining + processedTotal !== batch.totalRows || result.remaining > previousRemaining
        || (result.status === "processing" && result.remaining === previousRemaining)) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      failures = 0;
      if (result.remaining === 0) {
        const verified = await api.getBatch(batch.id);
        signal.throwIfAborted();
        if (!finished(verified)) throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
        batch = verified;
        publish(false);
        return batch;
      }
      batch = { ...batch, status: result.status, counts: { ...batch.counts, ...result.counts, pending: result.remaining } };
      publish(false);
    } catch (error) {
      signal.throwIfAborted();
      if (!(error instanceof ImportApiError) || error.code !== "CONNECTION_FAILED") throw error;
      publish(true);
      refreshBeforeRetry = true;
      await wait(Math.min(1000 * 2 ** Math.min(failures++, 5), 30000), signal);
    }
  }
}
