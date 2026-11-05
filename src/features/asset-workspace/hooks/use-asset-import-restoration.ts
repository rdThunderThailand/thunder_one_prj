"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import { z } from "zod";
import { autoMap } from "../domain/asset-import-mapping.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { restoredMappingView } from "../domain/asset-import-step.ts";
import type { ImportBatch, ImportConfirmBody } from "../domain/asset-import-types.ts";
import { ImportApiError } from "../services/asset-import-api.ts";
import { restoreImportFile } from "../services/asset-import-restore.ts";
import { getParsedImportFile, readImportSession, setParsedImportFile, takeImportNotice } from "../services/asset-import-session.ts";
import { assertActive, importFlowMemory, type FlowState, type ImportFlowRuntime, type Lifecycle } from "./asset-import-flow-state.ts";

/** Restore a batch after navigation/reload and retain the existing leave-page guards. */
export function useAssetImportRestoration(
  runtime: ImportFlowRuntime,
  state: FlowState,
  requestedUrlRef: RefObject<{ batchId: string | null; superseded: Set<string | null> } | null>,
  confirmLoop: (lifecycle: Lifecycle, batch: ImportBatch, first?: ImportConfirmBody) => Promise<void>,
) {
  const { api, options, userId, context, preview, batchId, routeKey, current, publish, run, clearLocal } = runtime;

  async function restoreFile(lifecycle: Lifecycle, batch: ImportBatch) {
    if (!options) return;
    publish(lifecycle, { restoringFile: true, restoreFailed: false });
    try {
      const parsed = await restoreImportFile(api, batch, options, lifecycle.controller.signal);
      assertActive(lifecycle);
      importFlowMemory.batchId = batch.id;
      setParsedImportFile(parsed);
      const { mapping } = current.current;
      publish(lifecycle, {
        parsed,
        selectedFile: parsed.file,
        mapping: mapping.length === parsed.headers.length ? mapping : autoMap(parsed.headers),
        restoringFile: false,
      });
    } catch {
      assertActive(lifecycle);
      publish(lifecycle, { restoringFile: false, restoreFailed: true });
    }
  }

  function retryFileRestore() {
    void run(async (lifecycle) => {
      const { batch } = current.current;
      if (batch) await restoreFile(lifecycle, batch);
    });
  }

  const restore = useEffectEvent(async () => {
    if (preview || !options?.ready) return;
    if (requestedUrlRef.current && requestedUrlRef.current.batchId !== batchId) return;
    requestedUrlRef.current = null;
    if (
      current.current.loadedRoute === routeKey &&
      (current.current.error || (current.current.batch?.id ?? null) === batchId)
    ) {
      return;
    }
    await run(async (lifecycle) => {
      publish(lifecycle, { restoring: true, loadedRoute: routeKey });
      if (!batchId) {
        publish(lifecycle, { batch: null, mappingView: false, notice: takeImportNotice(context) });
        return;
      }
      if (!z.uuid().safeParse(batchId).success) {
        throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION"), 400);
      }
      let batch: ImportBatch;
      try {
        batch = await api.getBatch(batchId);
      } catch (error) {
        if (!(error instanceof ImportApiError) || error.status !== 404) throw error;
        assertActive(lifecycle);
        clearLocal(lifecycle, "This import is no longer available.");
        return;
      }
      assertActive(lifecycle);
      const parsed = importFlowMemory.batchId === batch.id ? getParsedImportFile() : null;
      const saved = readImportSession(batch.id).state;
      const confirmation = batch.status === "uploaded" ? null
        : importFlowMemory.confirmation?.batchId === batch.id ? importFlowMemory.confirmation.body : saved?.confirmation ?? null;
      if (saved) lifecycle.pending = { batchId: batch.id, uploadId: saved.uploadId };
      const creator = batch.createdBy.id === userId;
      const needsFile = !parsed && creator && (batch.status === "uploaded" || batch.status === "validated");
      publish(lifecycle, {
        ...(needsFile ? { restoring: false, restoringFile: true } : {}),
        batch,
        confirmation,
        parsed,
        selectedFile: parsed?.file ?? null,
        mapping: importFlowMemory.validation?.batchId === batch.id ? importFlowMemory.validation.mapping
          : saved?.mapping ?? (parsed ? autoMap(parsed.headers) : []),
        rowsSent:
          Boolean(saved?.rowsSent) || importFlowMemory.validation?.batchId === batch.id || batch.status !== "uploaded" ||
          batch.counts.valid + batch.counts.warning + batch.counts.error > 0,
        mappingView: restoredMappingView(batch, saved?.mappingView),
      });
      if (batch.status === "uploaded" && !parsed && !creator) {
        throw new ImportApiError("PERMISSION_DENIED", requestErrorText("PERMISSION_DENIED", 403), 403);
      }
      if (needsFile) {
        await restoreFile(lifecycle, batch);
      } else if (batch.status === "processing") {
        publish(lifecycle, { restoring: false });
        if (!creator) {
          throw new ImportApiError("PERMISSION_DENIED", "Only the person who started this import can confirm it.", 403);
        }
        await confirmLoop(lifecycle, batch);
      }
    });
  });

  const ready = !preview && Boolean(options?.ready);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void restore();
    });
    return () => {
      active = false;
    };
  }, [api, batchId, routeKey, ready, state.busy]);

  useEffect(() => {
    if (!state.confirming && state.batch?.status !== "processing") return;
    const guard = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (!window.confirm("Registration is in progress. Leave this page?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", guard, true);
    return () => document.removeEventListener("click", guard, true);
  }, [state.confirming, state.batch?.status]);

  useEffect(() => {
    // A reload is safe once uploaded, because the file comes back from Core.
    if ((!state.busy || state.restoringFile) && state.batch?.status !== "processing") return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [state.busy, state.restoringFile, state.batch?.status]);

  return { retryFileRestore };
}
