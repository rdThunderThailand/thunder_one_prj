"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type ImportHistory, importHistoryFailure } from "../domain/asset-import-history";
import type { AssetActionError } from "../domain/asset-action-error";
import { getImportHistory } from "../services/asset-import-history-api";

type HistoryState = { context: string; open: boolean; page: number; version: number };
type Snapshot = { context: string; page: number; version: number; data: ImportHistory | null; error: AssetActionError | null };

export function useAssetImportHistory(context: string) {
  const [state, setState] = useState<HistoryState>({ context, open: false, page: 1, version: 0 });
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  if (state.context !== context) setState({ context, open: false, page: 1, version: 0 });
  const open = state.context === context && state.open;
  const current = open && snapshot?.context === context && snapshot.page === state.page && snapshot.version === state.version ? snapshot : null;

  useLayoutEffect(() => () => { controllerRef.current?.abort(); }, [context]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    void getImportHistory(context, state.page, controller.signal).then((data) => {
      if (!controller.signal.aborted) setSnapshot({ context, page: state.page, version: state.version, data, error: null });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const failure = importHistoryFailure(error);
      // Core rejects an offset beyond its last row; the only supplied query is valid paging.
      if (failure.status === 400 && failure.code === "VALIDATION" && state.page > 1) {
        setState((previous) => ({ ...previous, page: 1, version: previous.version + 1 }));
      } else setSnapshot({ context, page: state.page, version: state.version, data: null, error: failure });
    });
    return () => { controller.abort(); };
  }, [context, open, state.page, state.version]);

  function close() {
    controllerRef.current?.abort();
    setState((previous) => ({ ...previous, open: false }));
  }

  return {
    open, page: state.page, pending: open && !current, data: current?.data ?? null, error: current?.error ?? null,
    show: (trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setState((previous) => ({ context, open: true, page: 1, version: previous.version + 1 }));
    },
    close, restoreFocus: () => triggerRef.current?.focus(),
    retry: () => setState((previous) => ({ ...previous, version: previous.version + 1 })),
    changePage: (page: number) => setState((previous) => ({ ...previous, page })),
  };
}

export type AssetImportHistoryFlow = ReturnType<typeof useAssetImportHistory>;
