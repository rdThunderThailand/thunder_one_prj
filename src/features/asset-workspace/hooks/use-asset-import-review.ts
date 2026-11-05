import { importReviewSelection } from "../domain/asset-import-review.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ColumnMapping, ConfirmMode, ImportBatch, ImportConfirmBody } from "../domain/asset-import-types.ts";
import { ImportApiError } from "../services/asset-import-api.ts";
import { confirmImportBatch } from "../services/asset-import-confirm.ts";
import { prepareImportValidation, validateImportBatch } from "../services/asset-import-validation.ts";
import { readImportSession, saveImportSession, setParsedImportFile } from "../services/asset-import-session.ts";
import { assertActive, importFlowMemory, type ImportFlowRuntime, type Lifecycle } from "./asset-import-flow-state.ts";

/** Existing mapping, validation and confirm actions keep the same shared run guard. */
export function useAssetImportReview(runtime: ImportFlowRuntime, createBatch: (lifecycle: Lifecycle) => Promise<void>) {
  const {
    api, options, userId, context, preview,
    current, lifecycleRef, publish, run, discard, clearLocal,
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

  async function editMapping(): Promise<void> {
    if (preview || current.current.confirmation) return;
    await run(async (lifecycle) => {
      const { parsed, mapping } = current.current;
      await discard(lifecycle);
      assertActive(lifecycle);
      clearLocal(
        lifecycle,
        parsed ? null : "Select the file again to change the mapping.",
      );
      if (!parsed) return;
      setParsedImportFile(parsed);
      publish(lifecycle, { parsed, selectedFile: parsed.file, mapping });
      await createBatch(lifecycle);
    }, true);
  }

  async function confirmLoop(
    lifecycle: Lifecycle,
    batch: ImportBatch,
    first?: ImportConfirmBody,
  ) {
    const body = current.current.confirmation ?? first ?? {};
    importFlowMemory.confirmation = { batchId: batch.id, body: { ...body } };
    const session = readImportSession(batch.id).state;
    if (session) saveImportSession(batch.id, { ...session, confirmation: body });
    publish(lifecycle, { confirmation: body, confirming: true, mappingView: false });
    const verified = await confirmImportBatch(api, batch, body, lifecycle.controller.signal,
      (state) => publish(lifecycle, state));
    assertActive(lifecycle);
    publish(lifecycle, { batch: verified, progress: null, retrying: false });
  }

  async function confirm(mode: ConfirmMode, reason: string): Promise<void> {
    if (preview || !options?.ready) return;
    await run(async (lifecycle) => {
      const batch = current.current.batch;
      if (!batch) return;
      if (batch.createdBy.id !== userId) throw new ImportApiError(
        "PERMISSION_DENIED", requestErrorText("PERMISSION_DENIED", 403), 403,
      );
      const selection = importReviewSelection(batch.counts, mode, reason, options.serialOverride.maxLength);
      if (
        !current.current.confirmation &&
        batch.status !== "processing" &&
        (selection.invalidReason || selection.toRegister === 0)
      ) {
        throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION"), 400);
      }
      try {
        await confirmLoop(lifecycle, batch, batch.status === "processing" ? undefined : selection.body);
      } catch (error) {
        if (error instanceof ImportApiError && error.status === 400 && error.code === "VALIDATION") {
          importFlowMemory.confirmation = null;
          publish(lifecycle, { confirmation: null });
          const session = readImportSession(batch.id).state;
          if (session) saveImportSession(batch.id, { ...session, confirmation: undefined });
        }
        throw error;
      }
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

  return { runValidation, editMapping, confirmLoop, confirm, setMapping, showMapping, showReview };
}
