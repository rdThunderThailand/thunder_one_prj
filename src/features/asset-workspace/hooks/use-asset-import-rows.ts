"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { ImportEditResult } from "../domain/asset-import-edit.ts";
import type { RowsPage, RowsQuery } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, type AssetImportApi } from "../services/asset-import-api.ts";

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
) {
  const { severity, result, q, page, pageSize } = query;
  const key = JSON.stringify({ batchId, severity, result, q, page, pageSize });
  const [version, setVersion] = useState(0);
  const recover = useEffectEvent((error: ImportApiError) => {
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
  const [snapshot, setSnapshot] = useState<{
    api: AssetImportApi;
    key: string;
    version: number;
    page: RowsPage | null;
    error: ImportApiError | null;
  } | null>(null);

  useEffect(() => {
    if (!batchId) return;
    let active = true;
    void api
      .listRows(batchId, { severity, result, q, page, pageSize })
      .then((rows) => {
        if (active) setSnapshot({ api, key, version, page: rows, error: null });
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
        if (active && !recover(error)) setSnapshot({ api, key, version, page: null, error });
      });
    return () => {
      active = false;
    };
  }, [api, batchId, key, severity, result, q, page, pageSize, version]);

  const current =
    snapshot?.api === api && snapshot.key === key && snapshot.version === version
      ? snapshot
      : null;

  return {
    page: current?.page ?? null,
    loading: Boolean(batchId) && !current,
    error: current?.error ?? null,
    reload: () => setVersion((value) => value + 1),
    replace: (result: ImportEditResult) => {
      const updated = new Map([result.row, ...result.affectedRows].map((row) => [row.id, row]));
      setSnapshot((previous) => previous?.page ? {
        ...previous, page: { ...previous.page, rows: previous.page.rows.map((row) => updated.get(row.id) ?? row) },
      } : previous);
      // Core supplies the new filtered total and page membership, including rows entering/leaving a filter.
      setVersion((value) => value + 1);
    },
  };
}
