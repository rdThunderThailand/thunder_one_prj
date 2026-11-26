"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { ImportEditResult } from "../domain/asset-import-edit.ts";
import type { BatchStatus, RowsPage, RowsQuery } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, type AssetImportApi } from "../services/asset-import-api.ts";
import type { KeptImportPages } from "../services/kept-import-pages.ts";

export function useImportRowsSearch(search: string, query: string, onSearch: (value: string) => void) {
  const publish = useEffectEvent(onSearch);
  useEffect(() => {
    if (search.trim() === query) return;
    const timer = setTimeout(() => publish(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, query]);
}

export function useAssetImportRows(
  api: AssetImportApi,
  batchId: string | null,
  query: RowsQuery,
  recovery: { onResetPage?: () => void; onBatchUnavailable?: () => void } = {},
  kept?: { pages: KeptImportPages; status: BatchStatus | undefined },
) {
  const { severity, result, q, page, pageSize } = query;
  const key = JSON.stringify({ batchId, severity, result, q, page, pageSize });
  const [version, setVersion] = useState(0);
  const recover = useEffectEvent((error: ImportApiError) => {
    kept?.pages.clear();
    if (page > 1 && error.status === 400 && error.code === "VALIDATION" && recovery.onResetPage) {
      recovery.onResetPage();
      return true;
    }
    if ([404, 409].includes(error.status) && recovery.onBatchUnavailable) {
      recovery.onBatchUnavailable();
      return true;
    }
    return false;
  });
  const pages = kept?.pages;
  const keptKey = pages?.key(kept?.status, key) ?? null;
  // The status when the read starts: an answer read before it changed is not kept as the new one.
  const startKey = useEffectEvent(() => keptKey);
  const [snapshot, setSnapshot] = useState<{
    api: AssetImportApi;
    key: string;
    version: number;
    page: RowsPage | null;
    error: ImportApiError | null;
  } | null>(null);

  useEffect(() => {
    if (!batchId) return;
    const controller = new AbortController();
    const keepAs = startKey();
    const known = pages?.get(keepAs);
    void (known ? Promise.resolve(known) : api.listRows(batchId, { severity, result, q, page, pageSize }, controller.signal))
      .then((rows) => {
        if (controller.signal.aborted) return;
        pages?.set(keepAs, rows);
        setSnapshot({ api, key, version, page: rows, error: null });
      })
      .catch((caught: unknown) => {
        const error =
          caught instanceof ImportApiError
            ? new ImportApiError(
                caught.code,
                requestErrorText(caught.code, caught.status),
                caught.status,
                caught.details,
              )
            : new ImportApiError("INTERNAL", requestErrorText("INTERNAL"));
        if (!controller.signal.aborted && !recover(error)) setSnapshot({ api, key, version, page: null, error });
      });
    return () => {
      controller.abort();
    };
  }, [api, batchId, key, severity, result, q, page, pageSize, version, pages]);

  const current =
    snapshot?.api === api && snapshot.key === key && snapshot.version === version
      ? snapshot
      : null;
  // Without this a kept page would show the loading rows for one frame first.
  const shown = current?.page ?? (current ? null : pages?.get(keptKey) ?? null);

  return {
    page: shown,
    loading: Boolean(batchId) && !current && !shown,
    error: current?.error ?? null,
    reload: () => { pages?.clear(); setVersion((value) => value + 1); },
    replace: (result: ImportEditResult) => {
      const updated = new Map([result.row, ...result.affectedRows].map((row) => [row.id, row]));
      const next = version + 1;
      pages?.clear();
      // The saved values stay on screen while the page is read again.
      setSnapshot((previous) => previous?.page ? {
        ...previous, version: next, page: { ...previous.page, rows: previous.page.rows.map((row) => updated.get(row.id) ?? row) },
      } : previous);
      // Core supplies the new filtered total and page membership, including rows entering/leaving a filter.
      setVersion(next);
    },
  };
}
