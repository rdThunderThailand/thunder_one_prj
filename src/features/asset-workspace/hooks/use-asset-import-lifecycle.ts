"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { autoMap } from "../domain/asset-import-mapping.ts";
import type { AssetImportApi } from "../services/asset-import-api.ts";
import { getParsedImportFile, setParsedImportFile } from "../services/asset-import-session.ts";
import { emptyState, importFlowMemory, type FlowState, type Lifecycle } from "./asset-import-flow-state.ts";

const IMPORT_PATH = "/asset-workspace/assets/import";

/** Keep navigation, account isolation and the single state snapshot in one place. */
export function useAssetImportLifecycle(api: AssetImportApi, context: string) {
  const [version, setVersion] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = process.env.NODE_ENV === "development" && searchParams.get("preview") === "upload";
  const batchId = preview ? null : searchParams.get("batch");
  const routeKey = `${batchId ?? ""}:${version}`;
  const [snapshot, setSnapshot] = useState(() => emptyState(context));
  const state = snapshot.context === context ? snapshot : emptyState(context);
  const current = useRef(snapshot);
  const lifecycleRef = useRef<Lifecycle | null>(null);
  const requestedUrl = useRef<{ batchId: string | null; superseded: Set<string | null> } | null>(
    null,
  );
  const observedUrl = useRef({ context, batchId });

  const publish = useCallback((lifecycle: Lifecycle, changes: Partial<FlowState>) => {
    if (lifecycle.controller.signal.aborted || lifecycleRef.current !== lifecycle) return;
    current.current = { ...current.current, ...changes, context: lifecycle.context };
    setSnapshot(current.current);
  }, []);

  useEffect(() => {
    const lifecycle: Lifecycle = {
      context,
      controller: new AbortController(),
      active: false,
      pending: null,
      validation: null,
    };
    lifecycleRef.current = lifecycle;
    requestedUrl.current = null;
    observedUrl.current = { context, batchId };
    if (!preview && importFlowMemory.context !== context) {
      importFlowMemory.context = context;
      importFlowMemory.batchId = null;
      importFlowMemory.pending = null;
      importFlowMemory.validation = null;
      importFlowMemory.confirmation = null;
      setParsedImportFile(null);
    }
    lifecycle.pending = preview ? null : importFlowMemory.pending;
    lifecycle.validation = !preview && importFlowMemory.validation?.batchId === batchId ? importFlowMemory.validation : null;
    const retained = !preview && importFlowMemory.batchId === batchId ? getParsedImportFile() : null;
    current.current = {
      ...emptyState(context),
      parsed: retained,
      selectedFile: retained?.file ?? null,
      mapping: retained ? autoMap(retained.headers) : [],
    };
    queueMicrotask(() => publish(lifecycle, {}));
    return () => {
      lifecycle.controller.abort();
      if (lifecycleRef.current?.context === context) {
        lifecycleRef.current.controller.abort();
      }
    };
    // URL changes are restored separately; the lifecycle belongs to the authenticated context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, context, preview, publish]);

  useLayoutEffect(() => {
    const previous = observedUrl.current;
    const lifecycle = lifecycleRef.current;
    if (lifecycle && lifecycle.context !== context) lifecycle.controller.abort();
    if (preview) {
      lifecycle?.controller.abort();
      return;
    }
    if (
      !lifecycle ||
      lifecycle.context !== context ||
      previous.context !== context ||
      previous.batchId === batchId
    ) {
      return;
    }
    const requested = requestedUrl.current;
    if (requested?.batchId === batchId) {
      observedUrl.current = { context, batchId };
      requestedUrl.current = null;
      return;
    }
    if (requested?.superseded.has(batchId)) return;

    lifecycle.controller.abort();
    const replacement: Lifecycle = {
      context,
      controller: new AbortController(),
      active: false,
      pending: importFlowMemory.pending?.batchId === batchId ? importFlowMemory.pending : null,
      validation: !preview && importFlowMemory.validation?.batchId === batchId ? importFlowMemory.validation : null,
    };
    lifecycleRef.current = replacement;
    observedUrl.current = { context, batchId };
    requestedUrl.current = null;
    const retained = importFlowMemory.batchId === batchId ? getParsedImportFile() : null;
    current.current = {
      ...emptyState(context),
      parsed: retained,
      selectedFile: retained?.file ?? null,
      mapping: retained ? autoMap(retained.headers) : [],
    };
    queueMicrotask(() => publish(replacement, {}));
  }, [batchId, context, preview, publish]);

  function updateUrl(id: string | null) {
    const requested = requestedUrl.current;
    const superseded = new Set(requested?.superseded);
    superseded.add(observedUrl.current.batchId);
    if (requested) superseded.add(requested.batchId);
    requestedUrl.current = { batchId: id, superseded };
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("batch", id);
    else params.delete("batch");
    router.replace(`${IMPORT_PATH}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    const restoreHistory = () => {
      requestedUrl.current = null;
      setVersion((value) => value + 1);
    };
    window.addEventListener("popstate", restoreHistory);
    return () => window.removeEventListener("popstate", restoreHistory);
  }, []);

  return {
    state, current, lifecycleRef, requestedUrl, publish, updateUrl,
    preview, batchId, routeKey, version,
    reloadRoute: () => setVersion((value) => value + 1),
  };
}
