import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ColumnMapping } from "../domain/asset-import-types.ts";
import { ImportApiError } from "../services/asset-import-api.ts";
import { prepareImportValidation, validateImportBatch } from "../services/asset-import-validation.ts";
import { readImportSession, saveImportSession } from "../services/asset-import-session.ts";
import { assertActive, importFlowMemory, type ImportFlowRuntime } from "./asset-import-flow-state.ts";

/** Mapping and validation actions keep the same shared run guard. */
export function useAssetImportReview(runtime: ImportFlowRuntime) {
  const {
    api, options, context, preview,
    current, lifecycleRef, publish, run,
  } = runtime;

  function rememberView(batchId: string, mappingView: boolean) {
    const session = readImportSession(batchId).state;
    if (session) saveImportSession(batchId, { ...session, mappingView });
  }

  async function runValidation(): Promise<void> {
    if (preview || !options?.ready) return;
    await run(async (lifecycle) => {
      const selected = current.current.parsed;
      const batch = current.current.batch;
      if (!selected || !batch) {
        throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION"), 400);
      }
      if (!lifecycle.validation || lifecycle.validation.batchId !== batch.id) {
        lifecycle.validation = importFlowMemory.validation?.batchId === batch.id ? importFlowMemory.validation
          : prepareImportValidation(batch.id, selected, current.current.mapping, options);
      }
      importFlowMemory.validation = lifecycle.validation;
      const session = readImportSession(batch.id).state;
      if (session) saveImportSession(batch.id, { ...session, rowsSent: true });
      publish(lifecycle, { rowsSent: true });
      const refreshed = await validateImportBatch(
        api,
        lifecycle.validation,
        (progress) => publish(lifecycle, { progress }),
        () => assertActive(lifecycle),
      );
      rememberView(refreshed.id, refreshed.status === "validated");
      publish(lifecycle, {
        batch: refreshed,
        mappingView: refreshed.status === "validated",
        progress: null,
      });
    });
  }

  function setMapping(mapping: ColumnMapping) {
    const lifecycle = lifecycleRef.current;
    if (
      !lifecycle ||
      lifecycle.context !== context ||
      lifecycle.active ||
      current.current.rowsSent
    ) {
      return;
    }
    publish(lifecycle, { mapping, error: null });
    if (lifecycle.pending) {
      saveImportSession(lifecycle.pending.batchId, {
        mapping,
        uploadId: lifecycle.pending.uploadId,
      });
    }
  }

  function showMapping() {
    const lifecycle = lifecycleRef.current;
    if (preview && lifecycle && !lifecycle.active && current.current.parsed) {
      publish(lifecycle, { previewStep: 1 });
      return;
    }
    if (
      lifecycle &&
      !lifecycle.active &&
      current.current.batch?.status === "validated"
    ) {
      rememberView(current.current.batch.id, true);
      publish(lifecycle, { mappingView: true });
    }
  }

  function showReview() {
    const lifecycle = lifecycleRef.current;
    const batch = current.current.batch;
    if (
      lifecycle &&
      !lifecycle.active &&
      batch?.status === "validated" &&
      batch.counts.valid + batch.counts.warning > 0
    ) {
      rememberView(batch.id, false);
      publish(lifecycle, { mappingView: false });
    }
  }

  return { runValidation, setMapping, showMapping, showReview };
}
