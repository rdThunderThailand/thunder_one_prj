"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import { z } from "zod";
import { autoMap } from "../domain/asset-import-mapping.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import type { ImportBatch } from "../domain/asset-import-types.ts";
import { ImportApiError } from "../services/asset-import-api.ts";
import { getParsedImportFile, readImportSession, takeImportNotice } from "../services/asset-import-session.ts";
import { assertActive, importFlowMemory, type FlowState, type ImportFlowRuntime } from "./asset-import-flow-state.ts";

/** Restore a batch after navigation/reload and retain the existing leave-page guards. */
export function useAssetImportRestoration(
  runtime: ImportFlowRuntime,
  state: FlowState,
  requestedUrlRef: RefObject<{ batchId: string | null; superseded: Set<string | null> } | null>,
) {
  const { api, options, context, preview, batchId, routeKey, current, publish, run, discard, clearLocal } = runtime;

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
        publish(lifecycle, { batch: null, notice: takeImportNotice(context) });
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
      if (saved) lifecycle.pending = { batchId: batch.id, uploadId: saved.uploadId };
      publish(lifecycle, {
        batch,
        parsed,
        selectedFile: parsed?.file ?? null,
        mapping: saved?.mapping ?? (parsed ? autoMap(parsed.headers) : []),
      });
      if (batch.status === "uploaded" && !parsed) {
        publish(lifecycle, { notice: "Select the file again" });
        await discard(lifecycle);
        assertActive(lifecycle);
        clearLocal(lifecycle, "Select the file again");
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
    if (
      !state.busy &&
      state.batch?.status !== "uploaded" &&
      state.batch?.status !== "processing"
    ) {
      return;
    }
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [state.busy, state.batch?.status]);

}
