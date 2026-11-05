import { autoMap } from "../domain/asset-import-mapping.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ImportBatch } from "../domain/asset-import-types.ts";
import { ImportApiError } from "../services/asset-import-api.ts";
import { parseImportFile } from "../services/asset-import-parse.ts";
import { removeImportSession, saveImportSession, setParsedImportFile } from "../services/asset-import-session.ts";
import { startImportBatch } from "../services/asset-import-start.ts";
import { assertActive, importFlowMemory, type ImportFlowRuntime, type Lifecycle } from "./asset-import-flow-state.ts";

/** P1: select/remove a file, then create or resume its source upload and batch. */
export function useAssetImportUpload(runtime: ImportFlowRuntime) {
  const { api, options, preview, version, current, lifecycleRef, publish, updateUrl, run, discard, clearLocal } = runtime;

  async function selectFile(file: File): Promise<void> {
    if (!options || (!options.ready && !preview)) return;
    await run(async (lifecycle) => {
      await discard(lifecycle);
      assertActive(lifecycle);
      clearLocal(lifecycle);
      publish(lifecycle, { selectedFile: file, parsing: true, progress: null });
      const parsed = await parseImportFile(file, options);
      assertActive(lifecycle);
      if (!preview) setParsedImportFile(parsed);
      publish(lifecycle, { parsed, mapping: autoMap(parsed.headers) });
    });
  }

  async function clearFile(): Promise<boolean> {
    return run(async (lifecycle) => {
      await discard(lifecycle);
      assertActive(lifecycle);
      clearLocal(lifecycle);
    });
  }

  async function createBatch(lifecycle: Lifecycle) {
    if (preview) return;
    const selected = current.current.parsed;
    if (!selected || !options?.ready) {
      throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION"), 400);
    }
    lifecycle.pending ??= {
      batchId: crypto.randomUUID(),
      uploadId: crypto.randomUUID(),
    };
    const pending = lifecycle.pending;
    importFlowMemory.pending = pending;
    importFlowMemory.batchId = pending.batchId;
    saveImportSession(pending.batchId, {
      mapping: current.current.mapping,
      uploadId: pending.uploadId,
    });
    let batch: ImportBatch;
    try {
      batch = await startImportBatch(
        api,
        pending,
        selected,
        (progress) => publish(lifecycle, { progress }),
        () => assertActive(lifecycle),
      );
    } catch (error) {
      if (error instanceof ImportApiError && error.code === "UPLOAD_EXPIRED") {
        restartExpiredUpload(lifecycle);
      }
      throw error;
    }
    publish(lifecycle, {
      batch,
      loadedRoute: `${batch.id}:${version}`,
      progress: null,
    });
    updateUrl(batch.id);
  }

  function restartExpiredUpload(lifecycle: Lifecycle) {
    assertActive(lifecycle);
    if (lifecycle.pending) removeImportSession(lifecycle.pending.batchId);
    // A source upload belongs to one batch: expiry replaces the pair, never just the upload ID.
    const pending = { batchId: crypto.randomUUID(), uploadId: crypto.randomUUID() };
    lifecycle.pending = pending;
    importFlowMemory.pending = pending;
    importFlowMemory.batchId = pending.batchId;
    saveImportSession(pending.batchId, { mapping: current.current.mapping, uploadId: pending.uploadId });
  }

  async function startBatch(): Promise<void> {
    if (preview) {
      const lifecycle = lifecycleRef.current;
      if (lifecycle && !lifecycle.active && current.current.parsed) {
        publish(lifecycle, { previewStep: 1, error: null });
      }
      return;
    }
    await run(async (lifecycle) => {
      if (current.current.batch) return;
      await createBatch(lifecycle);
    }, true);
  }

  return { selectFile, clearFile, startBatch, createBatch };
}
