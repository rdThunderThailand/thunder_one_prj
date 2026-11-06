"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { exportCountIssue, filteredAssetExport, selectedAssetExport, type AssetExportScope } from "../domain/asset-export";
import { AssetExportError, requestAssetExport } from "../services/asset-export-client";
import type { AssetListQuery } from "../services/assets-list-query";
import { downloadBlob } from "../services/asset-import-template";

type ExportState = { key: string; scope: AssetExportScope | null; pending: boolean; error: AssetExportError | null };
const empty = (key: string): ExportState => ({ key, scope: null, pending: false, error: null });

export function useAssetExport(context: string, viewKey: string) {
  const key = `${context}:${viewKey}`;
  const [state, setState] = useState(() => empty(key));
  const controllerRef = useRef<AbortController | null>(null);
  const scopeRef = useRef<{ key: string; active: boolean } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // Like list selection, an open scope must reset when its account/query/result state changes.
  if (state.key !== key) setState(empty(key));
  const current = state.key === key ? state : empty(key);

  useLayoutEffect(() => {
    const guard = { key, active: true };
    scopeRef.current = guard;
    return () => {
      guard.active = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [key]);

  function open(build: () => AssetExportScope, trigger: HTMLElement | null) {
    if (controllerRef.current) return;
    try {
      triggerRef.current = trigger;
      setState({ ...empty(key), scope: build() });
    }
    catch { toast.error("The export scope could not be prepared. Refresh the list and try again."); }
  }

  function close() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(empty(key));
  }

  async function download() {
    const guard = scopeRef.current;
    if (!current.scope || exportCountIssue(current.scope.count) || controllerRef.current || !guard?.active || guard.key !== key) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => guard.active && controllerRef.current === controller && !controller.signal.aborted;
    setState({ ...current, pending: true, error: null });
    try {
      const file = await requestAssetExport(context, current.scope.request, controller.signal);
      if (!isCurrent()) return;
      downloadBlob(file.blob, file.filename);
      setState(empty(key));
    } catch (error) {
      if (!isCurrent()) return;
      const failure = error instanceof AssetExportError ? error
        : new AssetExportError("The file could not be downloaded. Try again.", 0, "DOWNLOAD_FAILED");
      setState({ ...current, pending: false, error: failure });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  return {
    ...current,
    openFiltered: (query: AssetListQuery, count: number, trigger: HTMLElement | null) => open(() => filteredAssetExport(query, count), trigger),
    openSelected: (ids: string[], trigger: HTMLElement | null) => open(() => selectedAssetExport(ids), trigger),
    restoreFocus: () => triggerRef.current?.focus(),
    close,
    download,
  };
}

export type AssetExportFlow = ReturnType<typeof useAssetExport>;
