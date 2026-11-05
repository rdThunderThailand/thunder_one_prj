"use client";

import { useMemo } from "react";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { stepFor } from "../domain/asset-import-step.ts";
import { getAssetImportApi, ImportApiError, type AssetImportContext } from "../services/asset-import-api.ts";
import { readImportSession, removeImportSession, saveImportSession, setParsedImportFile } from "../services/asset-import-session.ts";
import { assertActive, emptyState, importFlowMemory, safeError, type ImportFlowRuntime, type Lifecycle } from "./asset-import-flow-state.ts";
import { useAssetImportOptions } from "./use-asset-import-options.ts";
import { useAssetImportLifecycle } from "./use-asset-import-lifecycle.ts";
import { useAssetImportUpload } from "./use-asset-import-upload.ts";
import { useAssetImportReview } from "./use-asset-import-review.ts";
import { useAssetImportRestoration } from "./use-asset-import-restoration.ts";

/** Public flow API: one state owner and one guarded request runner for all steps. */
export function useAssetImportFlow({ tenantId, userId }: AssetImportContext) {
  const context = `${tenantId}:${userId}`;
  const api = useMemo(() => getAssetImportApi({ tenantId, userId }), [tenantId, userId]);
  const optionsResource = useAssetImportOptions({ tenantId, userId }, api);
  const options = optionsResource.options;
  const lifecycle = useAssetImportLifecycle(api, context);
  const {
    state, current, lifecycleRef,
    publish, updateUrl,
    preview, batchId, routeKey, version,
  } = lifecycle;

  async function run(
    work: (lifecycle: Lifecycle) => Promise<void>,
    uploading = false,
  ): Promise<boolean> {
    const lifecycle = lifecycleRef.current;
    if (
      !lifecycle ||
      lifecycle.context !== context ||
      lifecycle.active ||
      lifecycle.controller.signal.aborted
    ) {
      return false;
    }
    lifecycle.active = true;
    publish(lifecycle, { busy: true, error: null, retrying: false, confirming: false, progress: null });
    try {
      await work(lifecycle);
      assertActive(lifecycle);
      return true;
    } catch (caught) {
      if (lifecycle.controller.signal.aborted) return false;
      let error = safeError(caught);
      if (
        uploading &&
        error instanceof ImportApiError &&
        error.code === "CONNECTION_FAILED"
      ) {
        error = new ImportApiError(
          error.code,
          "Could not reach the asset service. Your file is still selected. Try again.",
          error.status,
        );
      }
      if (
        error instanceof ImportApiError &&
        error.status === 404 &&
        error.code === "NOT_FOUND" &&
        current.current.batch
      ) {
        clearLocal(lifecycle, "This import is no longer available.");
        return false;
      }
      if (
        error instanceof ImportApiError &&
        error.code === "INVALID_STATE" &&
        current.current.batch
      ) {
        try {
          const batch = await api.getBatch(current.current.batch.id);
          assertActive(lifecycle);
          // A rejected confirm did not start when Core still reports uploaded.
          if (batch.status === "uploaded") {
            importFlowMemory.confirmation = null;
            const saved = readImportSession(batch.id).state;
            if (saved) saveImportSession(batch.id, { ...saved, confirmation: undefined });
          }
          publish(lifecycle, {
            batch,
            ...(batch.status === "uploaded" ? { confirmation: null } : {}),
            mappingView: false,
            loadedRoute: `${batch.id}:${version}`,
          });
          updateUrl(batch.id);
        } catch {
          /* Keep the original failure and selected data for Retry. */
        }
      }
      if (lifecycle.controller.signal.aborted || lifecycleRef.current !== lifecycle) {
        return false;
      }
      const retained = current.current.batch;
      if (retained && retained.id === lifecycle.pending?.batchId && !batchId) {
        const retainedId = retained.id;
        publish(lifecycle, { loadedRoute: `${retainedId}:${version}` });
        updateUrl(retainedId);
      }
      publish(lifecycle, { error });
      return false;
    } finally {
      lifecycle.active = false;
      publish(lifecycle, {
        busy: false,
        confirming: false,
        parsing: false,
        restoring: false,
        restoringFile: false,
        retrying: false,
      });
    }
  }

  function clearLocal(lifecycle: Lifecycle, notice: string | null = null) {
    if (preview) {
      publish(lifecycle, { ...emptyState(context), notice, busy: true });
      return;
    }
    const previous = current.current.batch?.id ?? lifecycle.pending?.batchId;
    if (previous) removeImportSession(previous);
    lifecycle.pending = null;
    lifecycle.validation = null;
    importFlowMemory.pending = null;
    importFlowMemory.validation = null;
    importFlowMemory.confirmation = null;
    importFlowMemory.batchId = null;
    setParsedImportFile(null);
    publish(lifecycle, {
      ...emptyState(context),
      notice,
      busy: true,
      loadedRoute: `:${version}`,
    });
    updateUrl(null);
  }

  async function discard(lifecycle: Lifecycle) {
    if (preview) return;
    if (current.current.confirmation) throw new ImportApiError("INVALID_STATE", requestErrorText("INVALID_STATE", 409), 409);
    let existing = current.current.batch;
    if (!existing && lifecycle.pending) {
      try {
        existing = await api.getBatch(lifecycle.pending.batchId);
      } catch (error) {
        if (error instanceof ImportApiError && error.status === 404) return;
        throw error;
      }
      assertActive(lifecycle);
      publish(lifecycle, { batch: existing });
    }
    if (existing) {
      await api.discard(existing.id);
      assertActive(lifecycle);
      removeImportSession(existing.id);
    }
  }

  const runtime: ImportFlowRuntime = {
    api,
    options,
    userId,
    context,
    preview,
    batchId,
    routeKey,
    version,
    current,
    lifecycleRef,
    publish,
    updateUrl,
    run,
    clearLocal,
    discard,
  };
  const upload = useAssetImportUpload(runtime);
  const review = useAssetImportReview(runtime);
  const restoration = useAssetImportRestoration(runtime, state, lifecycle.requestedUrl);
  const ready = !preview && Boolean(options?.ready);

  const derived = stepFor(state.batch, Boolean(state.parsed) || state.restoringFile || state.restoreFailed);
  return {
    api,
    preview,
    options,
    loading:
      optionsResource.loading ||
      Boolean(
        ready &&
          (state.context !== context ||
            state.restoring ||
            (batchId && state.loadedRoute !== routeKey)),
      ),
    ...state,
    step: preview ? state.previewStep :
      state.mappingView && state.batch?.status === "validated"
        ? (1 as const)
        : derived.step,
    error: optionsResource.error ?? state.error,
    selectFile: upload.selectFile,
    clearFile: upload.clearFile,
    startBatch: upload.startBatch,
    runValidation: review.runValidation,
    replaceFile: upload.clearFile,
    setMapping: review.setMapping,
    showMapping: review.showMapping,
    showReview: review.showReview,
    retryFileRestore: restoration.retryFileRestore,
    reload: () => {
      optionsResource.reload();
      lifecycle.reloadRoute();
    },
  };
}

export type AssetImportFlow = ReturnType<typeof useAssetImportFlow>;
